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
  const context = {
    exports: {},
    require: (name) => {
      assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const route = load('utils/routeEstimate.ts');
const point = (latitude, longitude) => ({ latitude, longitude });
const closeTo = (actual, expected, tolerance = 0.001) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} should be close to ${expected}`,
  );

test('direct-distance approximation handles known equatorial distances, antimeridian and identical points', () => {
  closeTo(route.directDistanceNm(point(0, 0), point(0, 1)), 60.04046);
  closeTo(route.directDistanceNm(point(0, 179), point(0, -179)), 120.08091);
  assert.equal(route.directDistanceNm(point(0, 0), point(0, 0)), 0);
  closeTo(route.directDistanceNm(point(90, 10), point(90, -90)), 0);
  closeTo(route.directDistanceNm(point(0, 0), point(0, 180)), 10807.2829);
  assert.ok(
    Number.isFinite(
      route.directDistanceNm(
        point(-39.760642, 14.12),
        point(39.760642, -165.88),
      ),
    ),
  );
});

test('invalid map coordinates cannot become distance or fuel; zeros remain valid', () => {
  for (const invalid of [
    null,
    {},
    point('0', 0),
    point(91, 0),
    point(0, 181),
    point(NaN, 0),
    point(0, Infinity),
  ]) {
    assert.equal(route.isRoutePoint(invalid), false);
    assert.equal(route.directDistanceNm(invalid, point(0, 0)), null);
  }
  assert.equal(route.isRoutePoint(point(0, 0)), true);
  for (const invalid of [-1, NaN, Infinity, null, '10'])
    assert.equal(route.estimateFuelLitres(invalid, 0.5), null);
  assert.equal(route.estimateFuelLitres(0, 0.5), 0);
});

test('fuel requires explicit positive L/nm input and uses unrounded distance', () => {
  for (const invalid of [
    '',
    ' ',
    '0',
    '-1',
    '1e3',
    'Infinity',
    '.5',
    '1,2.3',
    '1L',
    '9'.repeat(13),
  ]) {
    assert.equal(route.parseFuelRate(invalid), null, invalid);
  }
  assert.equal(route.parseFuelRate(' 0,5 '), 0.5);
  assert.equal(route.parseFuelRate('0.75'), 0.75);
  assert.equal(route.estimateFuelLitres(12.34567, 0.5), 6.172835);
  const tiny = route.directDistanceNm(point(0, 0), point(0, 0.00001));
  assert.ok(tiny > 0 && tiny < 0.01);
  assert.ok(route.estimateFuelLitres(tiny, 0.5) > 0);
  for (const rate of [null, 0, -1, Infinity, NaN])
    assert.equal(route.estimateFuelLitres(10, rate), null);
});

const native = {
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  Modal: 'Modal',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: (value) => value },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
};
const dependencies = {
  react: { ...React, default: React },
  'react-native': native,
  '@expo/vector-icons': { FontAwesome: 'FontAwesome' },
  '@/utils/routeEstimate': route,
};
const modal = load(
  'components/ui/screen/home/components/FuelEstimateModal.tsx',
  dependencies,
);
const screen = load('components/ui/screen/home/RouteScreen.tsx', {
  ...dependencies,
  'react-native-maps': { default: 'MapView', Marker: 'Marker' },
  '@/components/ui/screen/home/components/FuelEstimateModal': modal,
});
const text = (root) =>
  root
    .findAllByType('Text')
    .map((node) =>
      node.children.filter((value) => typeof value === 'string').join(''),
    )
    .join('\n');

test('rapid map taps produce two markers; a third starts a new estimate and invalid points are refused', () => {
  let root;
  act(() => {
    root = create(React.createElement(screen.default));
  });
  const tap = (coordinate) =>
    root.root
      .findByType('MapView')
      .props.onPress({ nativeEvent: { coordinate } });
  try {
    act(() => {
      tap(point(0, 0));
      tap(point(0, 1));
    });
    assert.equal(root.root.findAllByType('Marker').length, 2);
    assert.equal(root.root.findByType('Modal').props.visible, true);
    assert.match(text(root.root), /60.04 nm/);
    assert.match(text(root.root), /Fuel estimate unavailable/);
    act(() => tap(point(91, 0)));
    assert.equal(root.root.findAllByType('Marker').length, 2);
    assert.match(text(root.root), /invalid coordinates/);
    act(() => root.root.findByType('Modal').props.onRequestClose());
    assert.equal(root.root.findByType('Modal').props.visible, false);
    act(() => tap(point(2, 3)));
    assert.equal(root.root.findAllByType('Marker').length, 1);
    assert.equal(root.root.findByType('Modal').props.visible, false);
  } finally {
    act(() => root.unmount());
  }
});

test('fuel modal never invents a rate and preserves nonzero small estimates in its labels', () => {
  let root;
  act(() => {
    root = create(
      React.createElement(modal.default, {
        visible: true,
        distance: 0.001,
        onClose() {},
      }),
    );
  });
  try {
    assert.equal(root.root.findByType('TextInput').props.value, '');
    assert.match(text(root.root), /Fuel estimate unavailable/);
    act(() => root.root.findByType('TextInput').props.onChangeText('0,5'));
    assert.match(text(root.root), /Estimated fuel: <0.01 L/);
    assert.match(text(root.root), /one way/);
    assert.match(text(root.root), /return trip, reserve and idling/);
    act(() => root.root.findByType('TextInput').props.onChangeText('-1'));
    assert.match(text(root.root), /Fuel estimate unavailable/);
  } finally {
    act(() => root.unmount());
  }
});
