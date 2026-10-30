const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

function load(filename, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../utils', filename), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {}, AbortController, setTimeout, clearTimeout, ...globals, require: name => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const c = load('conditions.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const now = Date.parse('2026-10-24T12:30:00Z');
const source = { name: 'test source', url: 'https://example.test', attribution: 'Test data' };
const weather = () => ({ success: true, data: {
  kind: 'current-weather', requestedLocation: { city: 'Test' }, location: { latitude: 8, longitude: 79.5, name: 'Test', country: 'LK', utcOffsetSeconds: 19800 },
  source, units: { temperature: '°C', windSpeed: 'm/s', humidity: '%', cloudCover: '%' }, available: true,
  fetchedAt: '2026-10-24T12:30:00.000Z', dataTime: '2026-10-24T12:00:00.000Z', staleAfter: '2026-10-24T13:00:00.000Z',
  temperatureC: 0, windSpeedMps: 0, humidityPercent: null, cloudCoverPercent: null, icon: null, description: null,
} });
const marine = () => ({ success: true, data: {
  kind: 'marine-forecast', requestedLocation: { latitude: 8, longitude: 79.5 }, location: { latitude: 8.04, longitude: 79.45 }, source,
  units: { waveHeight: 'm', time: 'UTC' }, fetchedAt: '2026-10-24T12:30:00.000Z', refreshAfter: '2026-10-24T13:30:00.000Z',
  modelIssuedAt: null, available: true, validFrom: '2026-10-24T00:00:00.000Z', validTo: '2026-10-25T00:00:00.000Z',
  hourly: Array.from({ length: 24 }, (_, i) => ({ time: new Date(Date.parse('2026-10-24T00:00:00Z') + i * 3_600_000).toISOString(), waveHeightM: i })),
} });

test('selects the actual UTC forecast hour and following hours, never the midnight first row', () => {
  const result = c.selectForecast(marine().data.hourly, now);
  assert.equal(result.selected.time, '2026-10-24T12:00:00.000Z');
  assert.deepEqual(plain(result.next.map(entry => entry.waveHeightM)), [13, 14, 15]);
  assert.equal(c.selectForecast(marine().data.hourly, Date.parse('2026-10-24T13:00:00Z')).selected.waveHeightM, 13);
  assert.equal(c.selectForecast(marine().data.hourly, Date.parse('2026-10-25T00:00:00Z')).selected, null);
  assert.equal(c.selectForecast(marine().data.hourly, Date.parse('2026-10-23T23:59:59Z')).selected, null);
});

test('selected time handles explicit offsets and refuses ambiguous local dates', () => {
  assert.equal(c.selectedInstant('2026-10-24T18:00:00+05:30', 0), now);
  assert.equal(c.selectedInstant(undefined, now), now);
  assert.ok(Number.isNaN(c.selectedInstant('2026-10-24T12:30:00', now)));
  assert.equal(c.formatUtc('2026-10-24T12:30:00Z'), '2026-10-24 12:30 UTC');
});

test('null wave heights stay unavailable and do not fall back to a nearby valid hour', () => {
  const raw = marine();
  raw.data.hourly[12].waveHeightM = null;
  const data = c.readMarine(raw);
  assert.equal(c.selectForecast(data.hourly, now).selected.waveHeightM, null);
  assert.equal(c.formatValue(null, 'm'), 'Unavailable');
  assert.equal(c.formatValue(0, 'm'), '0.0 m');
});

test('weather freshness ages while on screen and treats missing/future source times as unknown', () => {
  const data = c.readWeather(weather());
  assert.equal(c.weatherFreshness(data, now), 'recent');
  assert.equal(c.weatherFreshness(data, Date.parse('2026-10-24T13:00:00Z')), 'stale');
  assert.equal(c.weatherFreshness({ ...data, dataTime: null }, now), 'unknown');
  assert.equal(c.weatherFreshness(data, Date.parse('2026-10-24T11:00:00Z')), 'unknown');
  assert.equal(data.windSpeedMps, 0);
  assert.equal(data.humidityPercent, null);
});

test('invalid, legacy or wrong-unit responses cannot be presented as conditions', () => {
  assert.throws(() => c.readMarine({ success: true, data: { hourly: [] } }), /unavailable or invalid/);
  const wrongWave = marine(); wrongWave.data.units.waveHeight = 'ft';
  assert.throws(() => c.readMarine(wrongWave), /unavailable or invalid/);
  const badTime = marine(); badTime.data.hourly[0].time = '2026-10-24T00:00:00';
  assert.throws(() => c.readMarine(badTime), /unavailable or invalid/);
  const wrongWind = weather(); wrongWind.data.units.windSpeed = 'km/h';
  assert.throws(() => c.readWeather(wrongWind), /unavailable or invalid/);
  const badValue = weather(); badValue.data.windSpeedMps = '0';
  assert.throws(() => c.readWeather(badValue), /unavailable or invalid/);
});

test('marine coordinate resolution forwards explicit zero coordinates and uses no placeholder', async () => {
  let calls = 0;
  const provider = { Accuracy: { Balanced: 3 }, requestForegroundPermissionsAsync: async () => { calls++; return { status: 'granted' }; },
    getCurrentPositionAsync: async () => { calls++; return { coords: { latitude: 8, longitude: 79.5 } }; } };
  assert.deepEqual(plain(await c.marineCoordinates(0, 0, provider)), { latitude: 0, longitude: 0 });
  assert.equal(calls, 0);
  assert.deepEqual(plain(await c.marineCoordinates(undefined, undefined, provider)), { latitude: 8, longitude: 79.5 });
  assert.equal(calls, 2);
  await assert.rejects(c.marineCoordinates(8, undefined, provider), /valid latitude/);
  await assert.rejects(c.marineCoordinates(91, 0, provider), /valid latitude/);
});

test('denied permission or failed/timed-out GPS cannot produce fallback coordinates', async () => {
  const provider = { Accuracy: { Balanced: 3 }, requestForegroundPermissionsAsync: async () => ({ status: 'denied' }),
    getCurrentPositionAsync: async () => { throw new Error('Should not look up'); } };
  await assert.rejects(c.marineCoordinates(undefined, undefined, provider), /permission is required/);
  provider.requestForegroundPermissionsAsync = async () => ({ status: 'granted' });
  provider.getCurrentPositionAsync = async () => { throw new Error('GPS unavailable'); };
  await assert.rejects(c.marineCoordinates(undefined, undefined, provider), /GPS unavailable/);
  const fastTimeout = load('conditions.ts', {}, { setTimeout: callback => { queueMicrotask(callback); return 1; }, clearTimeout: () => {} });
  provider.getCurrentPositionAsync = () => new Promise(() => {});
  await assert.rejects(fastTimeout.marineCoordinates(undefined, undefined, provider), /timed out/);
});

async function mountRequest(get) {
  const useRequest = load('useConditionRequest.ts', { react: React, './api': { default: { get } } }).default;
  let snapshot;
  function Harness() { snapshot = useRequest('weather', c.readWeather); return null; }
  let root;
  await act(async () => { root = create(React.createElement(Harness)); });
  return { get value() { return snapshot; }, close: async () => { await act(async () => root.unmount()); } };
}

test('a late city response cannot overwrite a newer search; a failed search clears previous data', async () => {
  let oldResolve;
  let calls = 0;
  const hook = await mountRequest(async (url, options) => {
    calls++;
    if (calls === 1) return new Promise(resolve => { oldResolve = resolve; });
    if (calls === 3) throw { response: { data: { message: 'City unavailable' } } };
    const value = weather(); value.data.location.name = 'New city';
    assert.equal(options.params.city, 'New city');
    return { data: value };
  });
  try {
    let old;
    act(() => { old = hook.value.load({ city: 'Old city' }); });
    await act(async () => hook.value.load({ city: 'New city' }));
    await act(async () => { oldResolve({ data: weather() }); await old; });
    assert.equal(hook.value.data.location.name, 'New city');
    await act(async () => hook.value.load({ city: 'Failed city' }));
    assert.equal(hook.value.data, null);
    assert.equal(hook.value.error, 'City unavailable');
  } finally { await hook.close(); }
});

test('cancelled or rejected location lookup never starts a conditions HTTP request', async () => {
  let calls = 0;
  const hook = await mountRequest(async () => { calls++; return { data: weather() }; });
  let resolveLocation;
  let pending;
  act(() => { pending = hook.value.load(() => new Promise(resolve => { resolveLocation = resolve; })); });
  await hook.close();
  resolveLocation({ latitude: 8, longitude: 79.5 });
  await pending;
  assert.equal(calls, 0);
  const second = await mountRequest(async () => { calls++; });
  try {
    await act(async () => second.value.load(async () => { throw new Error('Location denied'); }));
    assert.equal(second.value.error, 'Location denied');
    assert.equal(calls, 0);
  } finally { await second.close(); }
});

test('freshness clock updates on a timer and immediately when the app resumes', async () => {
  let current = now;
  let tick, resume, removed = false, cleared = false;
  class Clock extends Date { static now() { return current; } }
  const useClock = load('useConditionsClock.ts', { react: React, 'react-native': { AppState: { addEventListener: (event, callback) => {
    resume = callback; return { remove: () => { removed = true; } };
  } } } }, { Date: Clock, setInterval: callback => { tick = callback; return 1; }, clearInterval: () => { cleared = true; } });
  let value, root;
  function Harness() { value = useClock.default(); return null; }
  await act(async () => { root = create(React.createElement(Harness)); });
  current += 60_000;
  act(() => tick());
  assert.equal(value, current);
  current += 3_600_000;
  act(() => resume('active'));
  assert.equal(value, current);
  await act(async () => root.unmount());
  assert.equal(removed, true);
  assert.equal(cleared, true);
});
