const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

function load(filename, dependencies = {}) {
    const compiled = ts.transpileModule(
        fs.readFileSync(path.join(__dirname, '../utils', filename), 'utf8'),
        {
            fileName: filename,
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
            },
        },
    ).outputText;
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
const helpers = load('profile.ts');
const me = '000000000000000000000001';
const other = '000000000000000000000002';
const user = (overrides) => ({
    userId: me,
    username: 'fisher',
    firstName: 'Alice',
    lastName: 'Fisher',
    email: 'alice@example.test',
    contact: '+94770000000',
    language: 'Sinhala',
    boatId: 'B01',
    isActive: true,
    ...overrides,
});
const envelope = (value = user(), profileVersion = 0) => ({
    success: true,
    data: { user: value, profileVersion },
});
const plain = (value) => JSON.parse(JSON.stringify(value));

async function mount(options = {}) {
    const listeners = new Set();
    const calls = { get: [], put: [] };
    const backing = options.backing || { user: user(), version: 0 };
    const api = {
        get: async (url, config) => {
            calls.get.push({ url, config });
            return options.get
                ? options.get(url, config)
                : { data: envelope({ ...backing.user }, backing.version) };
        },
        put: async (url, body, config) => {
            calls.put.push({ url, body, config });
            if (options.put) return options.put(url, body, config);
            if (body.expectedVersion !== backing.version)
                throw { response: { status: 409 } };
            const { expectedVersion, ...changes } = body;
            backing.user = { ...backing.user, ...changes };
            backing.version++;
            return { data: envelope({ ...backing.user }, backing.version) };
        },
    };
    const hook = load('useProfile.ts', {
        react: React,
        'react-native': {
            AppState: {
                addEventListener: (name, listener) => {
                    listeners.add(listener);
                    return { remove: () => listeners.delete(listener) };
                },
            },
        },
        './api': { default: api },
        './profile': helpers,
    }).default;
    let props = { userId: me, active: true },
        snapshot,
        root;
    function Harness() {
        snapshot = hook(props.userId, props.active);
        return null;
    }
    await act(async () => {
        root = create(React.createElement(Harness));
    });
    return {
        calls,
        options,
        backing,
        get value() {
            return snapshot;
        },
        update: async (changes) => {
            props = { ...props, ...changes };
            await act(async () => root.update(React.createElement(Harness)));
        },
        resume: async () => {
            await act(async () => {
                for (const listener of listeners) listener('active');
            });
        },
        close: async () => {
            await act(async () => root.unmount());
        },
    };
}

test('profile contract rejects malformed or different-account responses and emits only changed editable fields', () => {
    for (const bad of [
        envelope(user({ userId: other })),
        envelope(user(), -1),
        envelope(user(), '0'),
        envelope(user({ language: 'Unsupported' })),
        { success: true, data: {} },
    ]) {
        assert.throws(() => helpers.readProfile(bad, me));
    }
    const saved = helpers.readProfile(envelope(), me);
    const draft = helpers.profileDraft(saved.user);
    assert.equal(helpers.profilePatch(saved, draft), null);
    assert.deepEqual(
        plain(
            helpers.profilePatch(saved, {
                ...draft,
                boatId: '',
                firstName: ' Updated ',
            }),
        ),
        { firstName: 'Updated', boatId: '', expectedVersion: 0 },
    );
    for (const invalid of [
        { firstName: ' ' },
        { contact: 'x'.repeat(101) },
        { language: 'English' },
    ]) {
        assert.throws(() =>
            helpers.profilePatch(saved, { ...draft, ...invalid }),
        );
    }
});

test('saved profile survives a new screen instance, and double taps write only once', async () => {
    const backing = { user: user(), version: 0 };
    const hook = await mount({ backing });
    try {
        act(() => hook.value.openEditor());
        act(() => hook.value.change('firstName', ' Updated '));
        await act(async () => {
            await Promise.all([hook.value.save(), hook.value.save()]);
        });
        assert.equal(hook.calls.put.length, 1);
        assert.deepEqual(plain(hook.calls.put[0].body), {
            firstName: 'Updated',
            expectedVersion: 0,
        });
        assert.equal(hook.calls.put[0].config.timeout, 15000);
        assert.equal(hook.value.user.firstName, 'Updated');
        assert.equal(hook.value.editing, false);
        assert.match(hook.value.notice, /saved/);
    } finally {
        await hook.close();
    }
    const reopened = await mount({ backing });
    try {
        assert.equal(reopened.value.user.firstName, 'Updated');
        assert.equal(reopened.calls.get[0].config.timeout, 15000);
        act(() => reopened.value.openEditor());
        await act(async () => reopened.value.save());
        assert.equal(reopened.calls.put.length, 0);
    } finally {
        await reopened.close();
    }
});

test('uncertain save keeps draft without claiming success; reload recovers a committed write', async () => {
    const hook = await mount();
    try {
        hook.options.put = async (url, body) => {
            hook.backing.user = {
                ...hook.backing.user,
                firstName: body.firstName,
            };
            hook.backing.version++;
            throw new Error('lost response after commit');
        };
        act(() => hook.value.openEditor());
        act(() => hook.value.change('firstName', 'Stored name'));
        await act(async () => hook.value.save());
        assert.equal(hook.value.draft.firstName, 'Stored name');
        assert.equal(hook.value.editing, true);
        assert.equal(hook.value.user.firstName, 'Alice');
        assert.equal(hook.value.notice, null);
        assert.match(hook.value.error, /could not be confirmed/);
        await act(async () => hook.value.discardAndReload());
        assert.equal(hook.value.user.firstName, 'Stored name');
        assert.equal(hook.value.editing, false);
    } finally {
        await hook.close();
    }
});

test('stale edits conflict, retain draft and require a fresh version before retry', async () => {
    const hook = await mount();
    try {
        act(() => hook.value.openEditor());
        act(() => hook.value.change('contact', 'My edit'));
        hook.backing.user = { ...hook.backing.user, contact: 'Another device' };
        hook.backing.version++;
        await act(async () => hook.value.save());
        assert.match(hook.value.error, /changed elsewhere/);
        assert.equal(hook.value.draft.contact, 'My edit');
        assert.equal(hook.backing.user.contact, 'Another device');
        await act(async () => hook.value.discardAndReload());
        act(() => hook.value.openEditor());
        act(() => hook.value.change('contact', 'Fresh edit'));
        await act(async () => hook.value.save());
        assert.equal(hook.calls.put[1].body.expectedVersion, 1);
        assert.equal(hook.value.user.contact, 'Fresh edit');
    } finally {
        await hook.close();
    }
});

test('focus/resume reloads saved data without overwriting an open editor or accepting a stale read', async () => {
    let completeRead;
    const hook = await mount();
    try {
        hook.options.get = () =>
            new Promise((resolve) => {
                completeRead = resolve;
            });
        let pending;
        act(() => {
            pending = hook.value.reload();
        });
        const signal = hook.calls.get.at(-1).config.signal;
        act(() => hook.value.openEditor());
        act(() => hook.value.change('firstName', 'Draft'));
        assert.equal(signal.aborted, true);
        await act(async () => {
            completeRead({ data: envelope(user({ firstName: 'Stale' })) });
            await pending;
        });
        assert.equal(hook.value.user.firstName, 'Alice');
        assert.equal(hook.value.draft.firstName, 'Draft');
        await hook.resume();
        await hook.update({ active: false });
        await hook.update({ active: true });
        assert.equal(
            hook.calls.get.length,
            2,
            'focus/resume cannot overwrite the open editor',
        );
        hook.options.get = null;
        act(() => hook.value.closeEditor());
        hook.backing.user = user({ firstName: 'External update' });
        await hook.resume();
        assert.equal(hook.value.user.firstName, 'External update');
    } finally {
        await hook.close();
    }
});

test('validation and malformed save acknowledgements cannot claim a saved profile', async () => {
    const hook = await mount();
    try {
        act(() => hook.value.openEditor());
        act(() => hook.value.change('language', 'English'));
        await act(async () => hook.value.save());
        assert.equal(hook.calls.put.length, 0);
        assert.ok(hook.value.error);
        act(() => hook.value.change('language', 'Tamil'));
        for (const invalid of [
            envelope(user({ userId: other })),
            envelope(user({ language: 'Tamil' }), 0),
            envelope(user(), 1),
        ]) {
            hook.options.put = async () => ({ data: invalid });
            await act(async () => hook.value.save());
            assert.equal(hook.value.editing, true);
            assert.equal(hook.value.user.language, 'Sinhala');
            assert.equal(hook.value.notice, null);
        }
    } finally {
        await hook.close();
    }
});

test('leaving cancels local waiting; late profile results cannot update another account', async () => {
    let completeSave;
    const hook = await mount({
        put: () =>
            new Promise((resolve) => {
                completeSave = resolve;
            }),
    });
    try {
        act(() => hook.value.openEditor());
        act(() => hook.value.change('firstName', 'Previous account'));
        let pending;
        act(() => {
            pending = hook.value.save();
        });
        const signal = hook.calls.put[0].config.signal;
        hook.options.get = async () => ({
            data: envelope(user({ userId: other, firstName: 'Other account' })),
        });
        await hook.update({ userId: other });
        assert.equal(signal.aborted, true);
        await act(async () => {
            completeSave({
                data: envelope(user({ firstName: 'Late save' }), 1),
            });
            await pending;
        });
        assert.equal(hook.value.user.userId, other);
        assert.equal(hook.value.user.firstName, 'Other account');
        assert.equal(hook.value.saving, false);
    } finally {
        await hook.close();
    }
});
