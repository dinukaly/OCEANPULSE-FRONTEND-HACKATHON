const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function session(platform) {
  const storage = new Map([['token', 'legacy-token']]);
  const secure = new Map();
  const asyncStorage = {
    getItem: async (key) => storage.get(key) ?? null,
    setItem: async (key, value) => storage.set(key, value),
    removeItem: async (key) => storage.delete(key),
    multiSet: async (entries) => entries.forEach(([key, value]) => storage.set(key, value)),
    multiRemove: async (keys) => keys.forEach((key) => storage.delete(key)),
  };
  const dependencies = {
    '@react-native-async-storage/async-storage': { default: asyncStorage },
    'expo-secure-store': {
      getItemAsync: async (key) => secure.get(key) ?? null,
      setItemAsync: async (key, value) => secure.set(key, value),
      deleteItemAsync: async (key) => secure.delete(key),
    },
    'react-native': { Platform: { OS: platform } },
  };
  const source = fs.readFileSync(path.join(__dirname, '../utils/session.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, storage, secure };
}

for (const platform of ['android', 'ios', 'web']) {
  test(`${platform}: session save, restore and logout remove access and legacy/reset data`, async () => {
    const { api, storage, secure } = session(platform);
    assert.equal(await api.getToken(), null);
    await api.saveSession('access-token', { userId: '123', username: 'fisher' });
    assert.equal(await api.getToken(), 'access-token');
    assert.equal(storage.has('token'), false);
    assert.equal(storage.get('userId'), '123');
    if (platform !== 'web') {
      assert.equal(storage.has('oceanpulse.accessToken'), false);
      assert.equal(secure.get('oceanpulse.accessToken'), 'access-token');
    }
    for (const key of ['token', 'user', 'tempToken', 'resetToken']) storage.set(key, 'old');
    await api.clearSession();
    assert.equal(await api.getToken(), null);
    assert.equal(storage.size, 0);
    assert.equal(secure.size, 0);
  });
}
