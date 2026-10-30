const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

function component() {
    const filename = 'components/ui/screen/home/components/CreatePostModal.tsx';
    const compiled = ts.transpileModule(
        fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'),
        {
            fileName: filename,
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
                jsx: ts.JsxEmit.React,
            },
        },
    ).outputText;
    const dependencies = {
        react: { ...React, default: React },
        'react-native': {
            View: 'View',
            Text: 'Text',
            Modal: 'Modal',
            StyleSheet: { create: (value) => value },
        },
        'react-native-paper': {
            TextInput: 'TextInput',
            Button: 'Button',
            IconButton: 'IconButton',
        },
        '@/constants/ColorPallet': { COLORS: { primary: '#123456' } },
    };
    const context = {
        exports: {},
        require: (name) => {
            assert.ok(
                dependencies[name],
                `No gallery/storage access is needed for text posts: ${name}`,
            );
            return dependencies[name];
        },
    };
    vm.runInNewContext(compiled, context);
    return context.exports.default;
}
const CreatePostModal = component();

test('text-post editor keeps failed drafts, guards duplicate taps and clears only confirmed saves', async () => {
    let root, complete;
    const calls = [];
    const submit = (content) => {
        calls.push(content);
        return new Promise((resolve) => {
            complete = resolve;
        });
    };
    await act(async () => {
        root = create(
            React.createElement(CreatePostModal, {
                visible: true,
                onDismiss() {},
                onSubmit: submit,
            }),
        );
    });
    try {
        act(() =>
            root.root
                .findByType('TextInput')
                .props.onChangeText('  Kept draft  '),
        );
        let first, duplicate;
        act(() => {
            first = root.root.findByType('Button').props.onPress();
            duplicate = root.root.findByType('Button').props.onPress();
        });
        assert.equal(calls.length, 1);
        assert.equal(calls[0], 'Kept draft');
        assert.equal(root.root.findByType('Button').props.disabled, true);
        assert.equal(root.root.findByType('TextInput').props.disabled, true);
        await act(async () => {
            complete(false);
            await Promise.all([first, duplicate]);
        });
        assert.equal(
            root.root.findByType('TextInput').props.value,
            '  Kept draft  ',
        );
        assert.equal(root.root.findAllByType('Image').length, 0);
        assert.ok(
            root.root
                .findAllByType('Text')
                .some((node) =>
                    node.children.join('').includes('Check the feed'),
                ),
        );
        let retry;
        act(() => {
            retry = root.root.findByType('Button').props.onPress();
        });
        await act(async () => {
            complete(true);
            await retry;
        });
        assert.equal(root.root.findByType('TextInput').props.value, '');
    } finally {
        await act(async () => root.unmount());
    }
});

test('empty text never submits and an unexpected failure retains the editor draft', async () => {
    let root,
        calls = 0;
    await act(async () => {
        root = create(
            React.createElement(CreatePostModal, {
                visible: true,
                onDismiss() {},
                onSubmit: async () => {
                    calls++;
                    throw new Error('transport failure');
                },
            }),
        );
    });
    try {
        await act(async () => root.root.findByType('Button').props.onPress());
        assert.equal(calls, 0);
        act(() =>
            root.root
                .findByType('TextInput')
                .props.onChangeText('Offline text'),
        );
        await act(async () => root.root.findByType('Button').props.onPress());
        assert.equal(
            root.root.findByType('TextInput').props.value,
            'Offline text',
        );
        assert.equal(root.root.findByType('Button').props.loading, false);
    } finally {
        await act(async () => root.unmount());
    }
});
