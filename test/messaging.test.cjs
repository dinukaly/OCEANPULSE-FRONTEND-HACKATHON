const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

function load(filename, dependencies = {}, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils', filename), 'utf8'),
    { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {}, AbortController, URL, setTimeout, clearTimeout, setInterval, clearInterval, ...globals,
    require: name => { assert.ok(dependencies[name], `Unexpected dependency: ${name}`); return dependencies[name]; } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const id = n => n.toString(16).padStart(24, '0');
const me = id(1), peer = id(2);
const uuid = '10000000-0000-4000-8000-000000000001';
const message = (n = 10, overrides = {}) => ({ id: id(n), senderId: me, receiverId: peer, clientMessageId: null,
  message: `text${n}`, timestamp: '2026-10-24T12:00:00.000Z', read: false, readAt: null, ...overrides });
const response = data => ({ data: { success: true, data } });
const page = messages => ({ data: { success: true, data: messages, pagination: { limit: 25, hasMore: false, nextCursor: null } } });
const plain = value => JSON.parse(JSON.stringify(value));
const helpers = load('messaging.ts');

test('socket/HTTP acknowledgements reconcile one bubble; stale history/receipts cannot undo read state', () => {
  const pending = message(10, { id: 'pending-key', clientMessageId: uuid, localStatus: 'failed' });
  const saved = message(11, { clientMessageId: uuid });
  assert.equal(helpers.conversationMessages([saved], [pending]).length, 1);
  const read = { id: saved.id, read: true, readAt: '2026-10-24T12:02:00.000Z' };
  const marked = helpers.applyReceipts([saved], [read]);
  const merged = helpers.mergeMessages(marked, [saved, saved]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].read, true);
  assert.equal(helpers.applyReceipts(merged, [{ ...read, read: false, readAt: null }])[0].readAt, read.readAt);
  assert.equal(helpers.inConversation(message(12, { senderId: id(3) }), me, peer), false);
  assert.equal(helpers.isMessage({ ...saved, read: 'true' }), false);
});

test('local pending messages retain composition order instead of UUID order', () => {
  const pending = [message(10, { id: 'pending-z', timestamp: '2026-10-24T12:00:00.000Z', localStatus: 'sending' }),
    message(11, { id: 'pending-a', timestamp: '2026-10-24T12:01:00.000Z', localStatus: 'failed' })];
  assert.deepEqual(plain(helpers.conversationMessages([message()], pending).map(row => row.id)), [id(10), 'pending-z', 'pending-a']);
});

function transport(token = async () => 'private-token') {
  const timers = new Map(); let timerId = 0;
  const clients = [], events = [], statuses = []; let ready = 0;
  class FakeSocket {
    constructor(url) { this.url = url; this.sent = []; this.closed = false; clients.push(this); }
    send(value) { this.sent.push(JSON.parse(value)); }
    close(code = 1006) { if (this.closed) return; this.closed = true; this.onclose?.({ code }); }
    emit(event) { this.onmessage?.({ data: JSON.stringify(event) }); }
  }
  const module = load('messageConnection.ts', { '../constants/BASEURL': { default: () => 'https://api.example.com/api/v1/' },
    './session': { getToken: token } }, { setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout: key => timers.delete(key) });
  const stop = module.connectMessages({ token, socket: url => new FakeSocket(url), onEvent: event => events.push(event),
    onReady: () => ready++, onStatus: status => statuses.push(status) });
  return { module, clients, timers, events, statuses, stop, get ready() { return ready; },
    fire: ms => {
      const entry = [...timers].find(([, value]) => typeof ms === 'number' ? value.ms === ms : ms(value.ms));
      assert.ok(entry, 'expected an active timer'); timers.delete(entry[0]); entry[1].fn();
    } };
}

test('transport authenticates outside the URL, recovers every reconnect, watches dead connections and stops cleanly', async () => {
  const client = transport();
  try {
    await new Promise(resolve => setImmediate(resolve));
    const first = client.clients[0];
    assert.equal(first.url, 'wss://api.example.com/api/v1/messages/socket');
    assert.ok(!first.url.includes('private-token'));
    first.onopen();
    assert.deepEqual(first.sent[0], { type: 'auth', token: 'private-token' });
    first.emit({ type: 'message.saved' });
    assert.equal(client.events.length, 0);
    first.emit({ type: 'ready', userId: me });
    first.emit({ type: 'message.saved', message: message() });
    assert.equal(client.events.length, 1);
    assert.equal(client.ready, 1);
    client.fire(45000);
    assert.equal(first.closed, true);
    client.fire(ms => ms >= 1000 && ms < 1500);
    await new Promise(resolve => setImmediate(resolve));
    const second = client.clients[1];
    second.onopen(); second.emit({ type: 'ready', userId: me });
    assert.equal(client.ready, 2);
    assert.equal(client.module.socketUrl('http://localhost:3000/api/v1/'), 'ws://localhost:3000/api/v1/messages/socket');
    assert.throws(() => client.module.socketUrl('https://example.com/api/v1/?token=private'));
  } finally { client.stop(); }
  assert.equal(client.timers.size, 0);
  const count = client.events.length;
  client.clients[0].emit({ type: 'message.saved' });
  assert.equal(client.events.length, count);
});

test('unmount during token resolution cannot create a late socket; auth failures do not transmit chat content', async () => {
  let resolveToken;
  const client = transport(() => new Promise(resolve => { resolveToken = resolve; }));
  client.stop(); resolveToken('late-token'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.clients.length, 0);
  assert.equal(client.timers.size, 0);
  const denied = transport();
  try {
    await new Promise(resolve => setImmediate(resolve));
    denied.clients[0].close(4401);
    assert.equal(denied.ready, 1, 'REST session validation/history recovery must be requested');
    assert.ok(denied.timers.size > 0, 'reconnect backs off');
  } finally { denied.stop(); }
});

async function mount(options = {}) {
  const calls = { get: [], post: [] }, connections = [], intervals = new Set();
  let props = { me, peer, active: true }, snapshot, root;
  const api = {
    get: async (url, config) => { calls.get.push({ url, config }); return options.get ? options.get(url, config) : page(options.messages || []); },
    post: async (url, body, config) => {
      calls.post.push({ url, body, config });
      if (options.post) return options.post(url, body, config);
      return url === 'messages/send' ? response(message(50, { ...body, senderId: props.me })) :
        url === 'messages/mark-read' ? response({ receipts: body.messageIds.map(id => ({ id, read: true, readAt: '2026-10-24T12:02:00.000Z' })) }) :
          response(body.messageIds.map(id => ({ id, read: true, readAt: '2026-10-24T12:02:00.000Z' })));
    },
  };
  const contracts = load('contracts.ts');
  const paged = load('usePagedList.ts', { react: React, './api': { default: api }, './contracts': contracts }).default;
  const hook = load('useMessages.ts', { react: React, 'expo-crypto': { randomUUID: () => uuid }, './api': { default: api },
    './usePagedList': { default: paged }, './messaging': helpers,
    './messageConnection': { connectMessages: callbacks => { connections.push(callbacks); return () => { callbacks.stopped = true; }; } } },
    { setInterval: fn => { intervals.add(fn); return fn; }, clearInterval: fn => intervals.delete(fn) }).default;
  function Harness() { snapshot = hook(props.me, props.peer, props.active); return null; }
  await act(async () => { root = create(React.createElement(Harness)); });
  return { calls, options, connections, intervals, get value() { return snapshot; },
    tick: async () => { await act(async () => { for (const fn of intervals) fn(); }); },
    event: async event => { await act(async () => connections.at(-1).onEvent(event)); },
    ready: async () => { await act(async () => connections.at(-1).onReady()); },
    update: async changes => { props = { ...props, ...changes }; await act(async () => root.update(React.createElement(Harness))); },
    close: async () => { await act(async () => root.unmount()); } };
}

test('double taps post once; failed sends remain retryable with the same key and acknowledge once', async () => {
  let resolvePost;
  const hook = await mount({ post: (url, body) => new Promise(resolve => { resolvePost = resolve; }) });
  try {
    act(() => { assert.equal(hook.value.send(' hello '), true); assert.equal(hook.value.send(' hello '), false); });
    assert.equal(hook.calls.post.length, 1);
    assert.equal(hook.value.messages[0].localStatus, 'sending');
    await act(async () => { resolvePost(response(message(50, { clientMessageId: uuid, message: 'hello' }))); });
    assert.equal(hook.value.messages.length, 1);
    assert.equal(hook.value.messages[0].id, id(50));
    assert.equal(hook.calls.post[0].config.timeout, 15000);
  } finally { await hook.close(); }
  let attempts = 0;
  const failed = await mount({ post: async (url, body) => {
    if (++attempts === 1) throw new Error('timeout after commit');
    return response(message(50, { clientMessageId: body.clientMessageId, message: body.message }));
  } });
  try {
    await act(async () => { failed.value.send('kept text'); });
    assert.equal(failed.value.messages[0].localStatus, 'failed');
    const pending = failed.value.messages[0];
    await act(async () => { await Promise.all([failed.value.retry(pending), failed.value.retry(pending)]); });
    assert.equal(failed.calls.post.length, 2);
    assert.deepEqual(plain(failed.calls.post[0].body), plain(failed.calls.post[1].body));
    assert.equal(failed.value.messages.length, 1);
    assert.equal(failed.value.messages[0].localStatus, undefined);
  } finally { await failed.close(); }
});

test('socket-before-HTTP acknowledgements never duplicate a bubble and ignore unrelated conversations', async () => {
  let failPost;
  const hook = await mount({ post: () => new Promise((resolve, reject) => { failPost = reject; }) });
  try {
    act(() => { hook.value.send('hello'); });
    await hook.event({ type: 'message.saved', message: message(50, { clientMessageId: uuid, message: 'hello' }) });
    assert.equal(hook.value.messages.length, 1);
    await act(async () => { failPost(new Error('lost HTTP response')); });
    assert.equal(hook.value.messages[0].localStatus, undefined);
    assert.equal(hook.value.error, null);
    await hook.event({ type: 'message.saved', message: message(51, { senderId: id(3) }) });
    assert.equal(hook.value.messages.length, 1);
  } finally { await hook.close(); }
});

test('only visible incoming messages in a focused foreground chat become read; failed reads retry', async () => {
  let attempts = 0;
  const incoming = message(10, { senderId: peer, receiverId: me });
  const hook = await mount({ messages: [incoming], post: async (url, body) => {
    assert.equal(url, 'messages/mark-read');
    if (++attempts === 1) throw new Error('offline');
    return response({ receipts: [{ id: incoming.id, read: true, readAt: '2026-10-24T12:02:00.000Z' }] });
  } });
  try {
    assert.equal(hook.calls.post.length, 0);
    await act(async () => hook.value.markVisible([incoming.id]));
    assert.equal(hook.value.messages[0].read, false);
    await hook.update({ active: false });
    assert.equal(hook.connections.at(-1).stopped, true);
    await act(async () => hook.value.markVisible([incoming.id]));
    assert.equal(hook.calls.post.length, 1);
    await hook.update({ active: true });
    assert.equal(hook.value.messages[0].read, true);
    assert.equal(hook.calls.post.length, 2);
  } finally { await hook.close(); }
});

test('reconnect recovers missed history and old read receipts; stale history cannot revert a read event', async () => {
  let messages = [message(10)];
  const hook = await mount({ get: async () => page(messages) });
  try {
    await hook.ready();
    assert.equal(hook.value.messages[0].read, true);
    messages = [message(11), message(10)];
    await hook.ready();
    assert.equal(hook.value.messages.length, 2);
    await hook.event({ type: 'messages.read', receipts: [{ id: id(11), read: true, readAt: '2026-10-24T12:02:00.000Z' }] });
    await hook.tick();
    assert.equal(hook.value.messages.find(row => row.id === id(11)).read, true);
    assert.ok(hook.calls.post.some(call => call.url === 'messages/receipts' && call.body.messageIds.includes(id(10))));
  } finally { await hook.close(); }
  assert.equal(hook.intervals.size, 0);
});

test('leaving aborts local sends and a late HTTP response cannot update the next conversation', async () => {
  let complete;
  const hook = await mount({ post: () => new Promise(resolve => { complete = resolve; }) });
  try {
    act(() => { hook.value.send('hello'); });
    const signal = hook.calls.post[0].config.signal;
    await hook.update({ peer: id(3) });
    assert.equal(signal.aborted, true);
    await act(async () => { complete(response(message(50, { clientMessageId: uuid, message: 'hello' }))); });
    assert.equal(hook.value.messages.length, 0);
  } finally { await hook.close(); }
});

test('directory unread counts refresh on socket/resume and retain known counts when a request fails', async () => {
  const intervals = new Set(), connections = [], calls = [];
  let fail = false, count = 2, snapshot, root, active = true;
  const hook = load('useUnreadCounts.ts', { react: React, './api': { default: {
    post: async (url, body, config) => {
      calls.push({ url, body, config });
      if (fail) throw new Error('offline');
      return response(count ? [{ senderId: peer, count }] : []);
    },
  } }, './messageConnection': { connectMessages: callbacks => { connections.push(callbacks); return () => { callbacks.stopped = true; }; } } },
  { setInterval: fn => { intervals.add(fn); return fn; }, clearInterval: fn => intervals.delete(fn) }).default;
  function Harness() { snapshot = hook([peer], active); return null; }
  await act(async () => { root = create(React.createElement(Harness)); });
  try {
    assert.equal(snapshot.counts[peer], 2);
    assert.deepEqual(plain(calls[0].body), { senderIds: [peer] });
    fail = true;
    await act(async () => { connections.at(-1).onEvent({ type: 'message.saved' }); });
    assert.equal(snapshot.counts[peer], 2);
    assert.ok(snapshot.error);
    active = false;
    await act(async () => root.update(React.createElement(Harness)));
    assert.equal(intervals.size, 0);
    assert.equal(connections.at(-1).stopped, true);
    fail = false; count = 0; active = true;
    await act(async () => root.update(React.createElement(Harness)));
    assert.equal(snapshot.counts[peer], 0);
    assert.equal(snapshot.error, null);
  } finally { await act(async () => root.unmount()); }
  assert.equal(intervals.size, 0);
});

test('empty/unrelated read receipts preserve state without triggering another read request', () => {
  const original = [message()];
  assert.equal(helpers.applyReceipts(original, []), original);
  assert.equal(helpers.applyReceipts(original, [{ id: id(99), read: true, readAt: null }]), original);
});
