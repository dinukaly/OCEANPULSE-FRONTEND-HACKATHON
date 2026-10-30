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
    { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
  const context = { exports: {}, AbortController, setTimeout, clearTimeout, ...globals, require: name => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`); return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const receipt = (overrides = {}) => ({ id: '507f1f77bcf86cd799439011', receivedAt: '2026-10-24T12:00:00.000Z',
  location: { latitude: 0, longitude: 0 }, status: 'recorded', responderNotified: false, alreadyActive: false, ...overrides });
const response = value => ({ data: { success: true, data: value } });
const plain = value => JSON.parse(JSON.stringify(value));
async function mount(options = {}) {
  const calls = { permission: 0, gps: 0, posts: [], gets: [] };
  const timers = new Map(); let timerId = 0;
  const helpers = load('sos.ts', {}, {
    setTimeout: (callback, ms) => { assert.equal(ms, 15_000); timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
  });
  const location = {
    Accuracy: { High: 4 },
    requestForegroundPermissionsAsync: async () => { calls.permission++; return options.permission ? options.permission() : { status: 'granted' }; },
    getCurrentPositionAsync: async () => { calls.gps++; return options.gps ? options.gps() : { coords: { latitude: 0, longitude: 0 } }; },
  };
  const api = {
    post: async (url, body, config) => { calls.posts.push({ url, body, config }); return options.post ? options.post(url, body, config) : response(receipt()); },
    get: async (url, config) => { calls.gets.push({ url, config }); return options.get ? options.get(url, config) : response({ receipt: null }); },
  };
  const useSos = load('useSosRequest.ts', { react: React, 'expo-location': location, './api': { default: api }, './sos': helpers }).default;
  let snapshot, root;
  function Harness() { snapshot = useSos(); return null; }
  await act(async () => { root = create(React.createElement(Harness)); });
  return { get value() { return snapshot; }, calls, options,
    expire: () => { assert.ok(timers.size, 'an active deadline is required'); timers.values().next().value(); },
    close: async () => { await act(async () => root.unmount()); } };
}

test('mounting does not submit; double taps and calls after success cannot create more posts', async () => {
  const hook = await mount();
  try {
    assert.equal(hook.calls.posts.length, 0);
    assert.equal(hook.value.phase, 'ready');
    await act(async () => { await Promise.all([hook.value.send(), hook.value.send()]); });
    assert.equal(hook.calls.permission, 1);
    assert.equal(hook.calls.posts.length, 1);
    assert.equal(hook.value.phase, 'recorded');
    assert.equal(hook.value.receipt.responderNotified, false);
    assert.deepEqual(plain(hook.calls.posts[0].body), { latitude: 0, longitude: 0 });
    assert.equal(hook.calls.posts[0].config.timeout, 15000);
    await act(async () => hook.value.send());
    assert.equal(hook.calls.posts.length, 1);
  } finally { await hook.close(); }
});

test('denied permission never submits and a permitted retry resets the denied state', async () => {
  const hook = await mount({ permission: async () => ({ status: 'denied' }) });
  try {
    await act(async () => hook.value.send());
    assert.equal(hook.value.phase, 'error');
    assert.equal(hook.value.locationDenied, true);
    assert.equal(hook.value.uncertain, false);
    assert.match(hook.value.errorMessage, /No SOS request was submitted/);
    assert.equal(hook.calls.gps, 0);
    assert.equal(hook.calls.posts.length, 0);
    hook.options.permission = async () => ({ status: 'granted' });
    await act(async () => hook.value.send());
    assert.equal(hook.value.locationDenied, false);
    assert.equal(hook.value.errorMessage, '');
    assert.equal(hook.value.phase, 'recorded');
  } finally { await hook.close(); }
});

test('GPS failure and invalid coordinates never start a post', async () => {
  for (const gps of [async () => { throw new Error('GPS unavailable'); }, async () => ({ coords: { latitude: null, longitude: 0 } })]) {
    const hook = await mount({ gps });
    try {
      await act(async () => hook.value.send());
      assert.equal(hook.value.phase, 'error');
      assert.equal(hook.value.uncertain, false);
      assert.equal(hook.calls.posts.length, 0);
      assert.match(hook.value.errorMessage, /No SOS request was submitted/);
    } finally { await hook.close(); }
  }
});

test('GPS timeout releases the attempt and a late GPS result cannot submit', async () => {
  let resolveGps;
  const hook = await mount({ gps: () => new Promise(resolve => { resolveGps = resolve; }) });
  try {
    let pending;
    await act(async () => { pending = hook.value.send(); });
    assert.equal(hook.value.phase, 'locating');
    await act(async () => { hook.expire(); await pending; });
    assert.equal(hook.value.phase, 'error');
    assert.equal(hook.value.uncertain, false);
    resolveGps({ coords: { latitude: 0, longitude: 0 } });
    await act(async () => {});
    assert.equal(hook.calls.posts.length, 0);
  } finally { await hook.close(); }
});

test('uncertain retry reuses the original payload without asking for GPS again', async () => {
  let attempts = 0;
  const hook = await mount({ post: async () => {
    attempts++;
    if (attempts === 1) throw new Error('Network response lost');
    return response(receipt({ alreadyActive: true, location: { latitude: 8, longitude: 79 } }));
  } });
  try {
    await act(async () => hook.value.send());
    assert.equal(hook.value.uncertain, true);
    assert.match(hook.value.errorMessage, /Could not confirm/);
    hook.options.permission = async () => { throw new Error('Must not request GPS again'); };
    await act(async () => hook.value.send());
    assert.equal(hook.calls.permission, 1);
    assert.equal(hook.calls.gps, 1);
    assert.deepEqual(plain(hook.calls.posts[0].body), plain(hook.calls.posts[1].body));
    assert.equal(hook.value.phase, 'recorded');
    assert.equal(hook.value.uncertain, false);
    assert.equal(hook.value.receipt.location.latitude, 8, 'use stored receipt location, not current request position');
  } finally { await hook.close(); }
});

test('HTTP timeout remains uncertain, and a missing lookup does not claim cancellation or failure to save', async () => {
  const hook = await mount({ post: () => new Promise(() => {}) });
  try {
    let pending;
    await act(async () => { pending = hook.value.send(); });
    assert.equal(hook.value.phase, 'submitting');
    await act(async () => { hook.expire(); await pending; });
    assert.equal(hook.value.uncertain, true);
    assert.equal(hook.calls.posts[0].config.signal.aborted, true);
    await act(async () => hook.value.checkReceipt());
    assert.equal(hook.value.uncertain, true);
    assert.match(hook.value.errorMessage, /may still be processing/);
    assert.equal(hook.calls.posts.length, 1);
    hook.options.get = async () => response({ receipt: receipt({ alreadyActive: true }) });
    await act(async () => hook.value.checkReceipt());
    assert.equal(hook.value.phase, 'recorded');
    assert.equal(hook.value.receipt.alreadyActive, true);
    assert.equal(hook.calls.posts.length, 1);
  } finally { await hook.close(); }
});

test('receipt lookup can recover an existing record without GPS, permission or a write', async () => {
  const hook = await mount({ get: async () => response({ receipt: receipt({ alreadyActive: true, receivedAt: null, location: null }) }) });
  try {
    await act(async () => hook.value.checkReceipt());
    assert.equal(hook.value.phase, 'recorded');
    assert.equal(hook.value.receipt.receivedAt, null);
    assert.equal(hook.value.receipt.location, null);
    assert.equal(hook.calls.permission, 0);
    assert.equal(hook.calls.posts.length, 0);
    assert.equal(hook.calls.gets[0].url, 'sosAlerts/current');
  } finally { await hook.close(); }
});

test('invalid receipts and false responder claims never become a recorded state', async () => {
  for (const invalid of [receipt({ id: '' }), receipt({ responderNotified: true }), receipt({ status: 'dispatched' }),
    receipt({ receivedAt: 'yesterday' }), receipt({ location: { latitude: '0', longitude: 0 } })]) {
    const hook = await mount({ post: async () => response(invalid) });
    try {
      await act(async () => hook.value.send());
      assert.equal(hook.value.phase, 'error');
      assert.equal(hook.value.receipt, null);
      assert.equal(hook.value.uncertain, true);
    } finally { await hook.close(); }
  }
});

test('leaving during permission/GPS resolution prevents a late submission', async () => {
  let resolvePermission;
  const hook = await mount({ permission: () => new Promise(resolve => { resolvePermission = resolve; }) });
  let pending;
  await act(async () => { pending = hook.value.send(); });
  await hook.close();
  resolvePermission({ status: 'granted' });
  await pending;
  assert.equal(hook.calls.gps, 0);
  assert.equal(hook.calls.posts.length, 0);
});

test('leaving after POST only aborts local waiting; a fresh screen can still recover the saved receipt', async () => {
  let resolvePost;
  const hook = await mount({ post: () => new Promise(resolve => { resolvePost = resolve; }) });
  let pending;
  await act(async () => { pending = hook.value.send(); });
  await hook.close();
  assert.equal(hook.calls.posts[0].config.signal.aborted, true);
  resolvePost(response(receipt()));
  await pending;
  const reopened = await mount({ get: async () => response({ receipt: receipt({ alreadyActive: true }) }) });
  try {
    await act(async () => reopened.value.checkReceipt());
    assert.equal(reopened.value.phase, 'recorded');
    assert.equal(reopened.calls.posts.length, 0);
  } finally { await reopened.close(); }
});

async function mountScreen(platform) {
  let sends = 0, checks = 0, prompts = [], confirmed = false;
  const ReactModule = { ...React, default: React };
  const screen = load('../components/ui/screen/home/EmergencySosScreen.tsx', {
    react: ReactModule,
    'react-native': { ActivityIndicator: 'spinner', ScrollView: 'scroll', Text: 'text',
      StyleSheet: { create: styles => styles }, Linking: { openSettings() {} }, Platform: { OS: platform },
      Alert: { alert: (...args) => prompts.push(args) } },
    '@/components/ui/ActionButton': { default: props => React.createElement('button', props) },
    '@/components/ui/StatusBanner': { default: props => React.createElement('banner', props) },
    '@/constants/theme': { theme: { colors: {}, spacing: {}, type: {} } },
    '@/utils/useSosRequest': { default: () => ({ phase: 'ready', receipt: null, errorMessage: '', locationDenied: false,
      uncertain: false, send: async () => { sends++; }, checkReceipt: async () => { checks++; } }) },
  }, { window: { confirm: () => confirmed } }).default;
  let root;
  await act(async () => { root = create(React.createElement(screen, { navigation: { goBack() {} } })); });
  return { press: label => act(() => { root.root.findByProps({ label }).props.onPress(); }), prompts,
    get sends() { return sends; }, get checks() { return checks; }, confirm: value => { confirmed = value; },
    close: async () => { await act(async () => root.unmount()); } };
}

test('native confirmation cancellation and duplicate dialog taps never submit', async () => {
  const screen = await mountScreen('android');
  try {
    screen.press('Record SOS request');
    screen.press('Record SOS request');
    assert.equal(screen.prompts.length, 1);
    assert.equal(screen.sends, 0);
    act(() => screen.prompts[0][2][0].onPress());
    assert.equal(screen.sends, 0);
    screen.press('Record SOS request');
    act(() => screen.prompts[1][2][1].onPress());
    assert.equal(screen.sends, 1);
  } finally { await screen.close(); }
});

test('web requires a positive browser confirmation; receipt checking never submits', async () => {
  const screen = await mountScreen('web');
  try {
    screen.press('Record SOS request');
    assert.equal(screen.sends, 0);
    screen.confirm(true);
    screen.press('Record SOS request');
    assert.equal(screen.sends, 1);
    screen.press('Check existing receipt');
    assert.equal(screen.sends, 1);
    assert.equal(screen.checks, 1);
    assert.equal(screen.prompts.length, 0);
  } finally { await screen.close(); }
});
