const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(filename, dependencies = {}, globals = {}) {
  const compiled = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'),
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
    URL,
    ...globals,
    require: (name) => {
      assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('API URLs normalize local development paths and require HTTPS for release builds', () => {
  const { normalizeApiUrl } = load('utils/apiConfiguration.ts');
  assert.equal(
    normalizeApiUrl(' http://10.0.2.2:3000/api/v1/// '),
    'http://10.0.2.2:3000/api/v1/',
  );
  assert.equal(
    normalizeApiUrl('https://api.example.test/prefix/api/v1', true),
    'https://api.example.test/prefix/api/v1/',
  );
  for (const value of [
    undefined,
    '',
    'ftp://api.example.test/api/v1',
    'https://user:private@api.example.test/api/v1',
    'https://api.example.test/api/v1?secret=private/api/v1',
    'https://api.example.test/api/v1#private',
    'https://api.example.test/v2',
  ]) {
    assert.equal(normalizeApiUrl(value), undefined, value);
  }
  assert.equal(
    normalizeApiUrl('http://localhost:3000/api/v1', true),
    undefined,
  );
});

test('mobile diagnostics whitelist metadata without logging request credentials, bodies, URLs or error strings', () => {
  const lines = [];
  const { logFailure } = load(
    'utils/logging.ts',
    {},
    { console: { error: (line) => lines.push(line) } },
  );
  logFailure('auth.verify', {
    message: 'PRIVATE_SENTINEL',
    stack: 'PRIVATE_SENTINEL',
    config: {
      data: { otp: 'PRIVATE_SENTINEL', password: 'PRIVATE_SENTINEL' },
      url: 'PRIVATE_SENTINEL',
    },
    response: {
      status: 401,
      data: { code: 'UNAUTHORIZED', message: 'PRIVATE_SENTINEL' },
      headers: { 'x-request-id': '10000000-0000-4000-8000-000000000001' },
    },
  });
  assert.ok(!lines[0].includes('PRIVATE_SENTINEL'));
  assert.equal(JSON.parse(lines[0]).code, 'UNAUTHORIZED');
  assert.equal(
    JSON.parse(lines[0]).requestId,
    '10000000-0000-4000-8000-000000000001',
  );
  logFailure('PRIVATE_SENTINEL', {
    response: {
      data: { code: 'PRIVATE_SENTINEL' },
      headers: { 'x-request-id': 'PRIVATE_SENTINEL' },
    },
  });
  assert.ok(!lines[1].includes('PRIVATE_SENTINEL'));
});

function client(token) {
  let request, failure, created;
  const records = [],
    dispatched = [];
  let cleared = 0;
  const instance = {
    interceptors: {
      request: {
        use: (callback) => {
          request = callback;
        },
      },
      response: {
        use: (success, callback) => {
          failure = callback;
        },
      },
    },
  };
  load('utils/api.ts', {
    axios: {
      default: {
        create: (config) => {
          created = config;
          return instance;
        },
      },
    },
    '@/constants/BASEURL': {
      default: () => 'https://api.example.test/api/v1/',
      assertApiConfigured() {},
    },
    '@/utils/session': {
      getToken: token,
      clearSession: async () => {
        cleared++;
      },
    },
    '@/store': { default: { dispatch: (value) => dispatched.push(value) } },
    '@/store/authSlice': { logout: () => ({ type: 'logout' }) },
    './logging': { logFailure: (event, error) => records.push(event) },
  });
  return {
    request,
    failure,
    records,
    dispatched,
    created,
    get cleared() {
      return cleared;
    },
  };
}

test('shared API timeout is bounded and a secure-storage read failure cannot send an unauthenticated request', async () => {
  const api = client(async () => {
    throw new Error('PRIVATE_SENTINEL');
  });
  assert.equal(api.created.timeout, 15000);
  await assert.rejects(
    api.request({ headers: {} }),
    /Could not read your saved session/,
  );
  assert.equal(api.records[0], 'session.read');
  assert.equal(api.dispatched.length, 0);
  const signedIn = client(async () => 'access-token');
  assert.equal(
    (await signedIn.request({ headers: {} })).headers.Authorization,
    'Bearer access-token',
  );
});

test('unavailability preserves the session while 401 clears it through the existing logout path', async () => {
  const api = client(async () => 'access-token');
  await assert.rejects(api.failure({ response: { status: 503 } }));
  assert.equal(api.cleared, 0);
  assert.equal(api.dispatched.length, 0);
  await assert.rejects(api.failure({ response: { status: 401 } }));
  assert.equal(api.cleared, 1);
  assert.equal(api.dispatched[0].type, 'logout');
});
