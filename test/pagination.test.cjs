const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

function load(filename, dependencies = {}) {
  const source = fs.readFileSync(
    path.join(__dirname, '../utils', filename),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const context = {
    exports: {},
    AbortController,
    require: (name) => {
      assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const contracts = load('contracts.ts');
const id = (n) => n.toString(16).padStart(24, '0');
const page = (ids, more = false) => ({
  success: true,
  data: ids.map((n) => ({ id: id(n), text: String(n) })),
  pagination: {
    limit: 25,
    hasMore: more,
    nextCursor: more ? id(ids.at(-1)) : null,
  },
});
const plain = (value) => JSON.parse(JSON.stringify(value));
async function mount(get) {
  const usePagedList = load('usePagedList.ts', {
    react: React,
    './api': { default: { get } },
    './contracts': contracts,
  }).default;
  let snapshot;
  function Harness() {
    snapshot = usePagedList('messages/get?user1=a&user2=b', 'id');
    return null;
  }
  let root;
  await act(async () => {
    root = create(React.createElement(Harness));
  });
  return {
    get value() {
      return snapshot;
    },
    close: async () => {
      await act(async () => root.unmount());
    },
  };
}

test('malformed page contracts are rejected rather than silently truncating lists', () => {
  for (const value of [
    { success: true, data: [] },
    {
      ...page([1]),
      pagination: { limit: 25, hasMore: true, nextCursor: null },
    },
    {
      ...page([]),
      pagination: { limit: 25, hasMore: true, nextCursor: id(1) },
    },
  ]) {
    assert.throws(() => contracts.readPage(value), /Invalid paginated/);
  }
});

test('load-more failure keeps history/cursor and retry merges without duplicate IDs', async () => {
  let calls = 0;
  const hook = await mount(async (url, config) => {
    calls++;
    if (calls === 1) return { data: page([6, 5], true) };
    assert.equal(config.params.before, id(5));
    if (calls === 2) throw { response: { data: { message: 'Try later' } } };
    return { data: page([5, 4]) };
  });
  try {
    await act(async () => hook.value.loadMore());
    assert.equal(hook.value.error, 'Try later');
    assert.equal(hook.value.items.length, 2);
    assert.equal(hook.value.hasMore, true);
    await act(async () => hook.value.loadMore());
    assert.deepEqual(plain(hook.value.items.map((item) => item.id)), [
      id(6),
      id(5),
      id(4),
    ]);
    assert.equal(hook.value.hasMore, false);
    assert.equal(hook.value.error, null);
  } finally {
    await hook.close();
  }
});

test('refresh discards a stale older-page response even when transport ignores cancellation', async () => {
  let resolveOlder;
  let olderSignal;
  let calls = 0;
  const hook = await mount(async (url, config) => {
    calls++;
    if (calls === 1) return { data: page([6, 5], true) };
    if (calls === 2) {
      olderSignal = config.signal;
      return new Promise((resolve) => {
        resolveOlder = resolve;
      });
    }
    return { data: page([7, 6]) };
  });
  try {
    let pending;
    act(() => {
      pending = hook.value.loadMore();
    });
    await act(async () => hook.value.refresh());
    assert.equal(olderSignal.aborted, true);
    await act(async () => {
      resolveOlder({ data: page([4, 3]) });
      await pending;
    });
    assert.deepEqual(plain(hook.value.items.map((item) => item.id)), [
      id(7),
      id(6),
    ]);
  } finally {
    await hook.close();
  }
});

test('polling traverses every missed page and preserves the older-history cursor despite local sends', async () => {
  const beforeValues = [];
  const responses = [
    page([10, 9], true),
    page([20, 19], true),
    page([18, 17], true),
    page([10, 9], true),
    page([8]),
  ];
  const hook = await mount(async (url, config) => {
    beforeValues.push(config.params.before);
    return { data: responses.shift() };
  });
  try {
    act(() =>
      hook.value.setItems((previous) => [
        ...previous,
        { id: id(20), text: 'local saved send' },
      ]),
    );
    await act(async () => hook.value.refreshLatest());
    assert.deepEqual(
      plain(hook.value.items.map((item) => item.id).sort()),
      [9, 10, 17, 18, 19, 20].map(id),
    );
    await act(async () => hook.value.loadMore());
    assert.deepEqual(beforeValues, [
      undefined,
      undefined,
      id(19),
      id(17),
      id(9),
    ]);
    assert.equal(hook.value.items.length, 7);
  } finally {
    await hook.close();
  }
});

test('a previously empty conversation catches every missed page after receiving socket-only messages', async () => {
  const responses = [
    page([]),
    page([60, 59], true),
    page([58, 57], true),
    page([2, 1]),
  ];
  const beforeValues = [];
  const hook = await mount(async (url, config) => {
    beforeValues.push(config.params.before);
    return { data: responses.shift() };
  });
  try {
    act(() =>
      hook.value.setItems([{ id: id(1), text: 'received through a socket' }]),
    );
    await act(async () => hook.value.refreshLatest());
    assert.deepEqual(
      plain(hook.value.items.map((item) => item.id).sort()),
      [1, 2, 57, 58, 59, 60].map(id),
    );
    assert.deepEqual(beforeValues, [undefined, undefined, id(59), id(57)]);
    assert.equal(hook.value.hasMore, false);
  } finally {
    await hook.close();
  }
});
