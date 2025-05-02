import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import FuelEstimateModal from '@/components/ui/screen/home/components/FuelEstimateModal'; // import the modal we built earlier

const { width, height } = Dimensions.get('window');

export default function RouteScreen({navigation}: any) {
  const [markers, setMarkers] = useState<{ latitude: number; longitude: number }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [distance, setDistance] = useState(0);

  const fuelRate = 0.5; // liters per nautical mile

  const handleMapPress = (e: { nativeEvent: { coordinate: any; }; }) => {
    const newMarker = e.nativeEvent.coordinate;

    if (markers.length === 2) {
      setMarkers([newMarker]);
      setShowModal(false);
      return;
    }

    const updated = [...markers, newMarker];
    setMarkers(updated);

    if (updated.length === 2) {
      const d = getDistanceFromLatLonInNm(
        updated[0].latitude,
        updated[0].longitude,
        updated[1].latitude,
        updated[1].longitude
      );
      setDistance(d);
      setShowModal(true);
    }
  };

  const getDistanceFromLatLonInNm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKm = R * c;
    const distanceInNm = distanceInKm * 0.539957; // Convert to nautical miles
    return Number(distanceInNm.toFixed(2));
  };

  return (
    <View style={styles.container}>
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
        {markers.map((marker, index) => (
          <Marker key={index} coordinate={marker} />
        ))}
      </MapView>

      <FuelEstimateModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        distance={distance}
        fuelRate={fuelRate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
});