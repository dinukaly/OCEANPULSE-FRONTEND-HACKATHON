import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';
import FuelEstimateModal from '@/components/ui/screen/home/components/FuelEstimateModal';
import {
  directDistanceNm,
  isRoutePoint,
  type RoutePoint,
} from '@/utils/routeEstimate';

type RouteSelection = { markers: RoutePoint[]; showEstimate: boolean };

export default function RouteScreen() {
  const [selection, setSelection] = useState<RouteSelection>({
    markers: [],
    showEstimate: false,
  });
  const [error, setError] = useState<string | null>(null);
  const distance = useMemo(
    () =>
      selection.markers.length === 2
        ? directDistanceNm(selection.markers[0], selection.markers[1])
        : null,
    [selection.markers],
  );

  const handleMapPress = (event: MapPressEvent) => {
    const point = event.nativeEvent.coordinate;
    if (!isRoutePoint(point)) {
      setError('This point has invalid coordinates. Select another point.');
      return;
    }
    setError(null);
    // Derive both markers from the latest state, including rapidly consecutive taps.
    setSelection((previous) => {
      const markers =
        previous.markers.length === 2 ? [point] : [...previous.markers, point];
      return { markers, showEstimate: markers.length === 2 };
    });
  };

  return (
    <View style={styles.container}>
      <Text>
        Select two points for an approximate direct distance. A third point
        starts a new estimate.
      </Text>
      {error && <Text accessibilityLiveRegion="polite">{error}</Text>}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 1,
          longitudeDelta: 1,
        }}
        onPress={handleMapPress}
      >
        {selection.markers.map((marker, index) => (
          <Marker key={index} coordinate={marker} />
        ))}
      </MapView>
      <FuelEstimateModal
        visible={selection.showEstimate}
        distance={distance}
        onClose={() =>
          setSelection((previous) => ({ ...previous, showEstimate: false }))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },
});
