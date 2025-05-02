import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/ColorPallet";
import api from '@/utils/api';

export default function EmergencySosScreen({ navigation }: any) {
  const [sending, setSending] = useState(true);
  const [cancelEnabled, setCancelEnabled] = useState(true);

  useEffect(() => {
    const sendSos = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserName = await AsyncStorage.getItem('username');
        console.log("Retrieved storedUserId:", storedUserId,storedUserName);

        if (!storedUserId || !storedUserName) {
          Alert.alert("Error", "User ID not found. Please login again.");
          navigation.goBack();
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Denied", "Location permission is required to send SOS.");
          navigation.goBack();
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const payload = {
          latitude,
          longitude,
          userId: storedUserId,
          username: storedUserName
        };

        const response = await api.post('sosAlerts/sos', payload);
        
        if (response.data && response.data.success) {
          setSending(false);
          setCancelEnabled(false);
        } else {
          throw new Error('Failed to send SOS');
        }
      } catch (error: any) {
        console.error("Failed to send SOS:", error);
        if (error.response?.status === 400) {
          Alert.alert("SOS Already Sent", error.response.data.message || "You have already sent an SOS request.");
        } else {
          Alert.alert("Error", "Failed to send SOS. Please try again.");
        }
        navigation.goBack();
      }
    };

    sendSos();

    const cancelTimer = setTimeout(() => {
      setCancelEnabled(false);
    }, 5000);

    return () => clearTimeout(cancelTimer);
  }, []);

  const handleCancel = () => {
    if (cancelEnabled) {
      navigation.goBack();
    }
  };

  const handleBackHome = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {sending ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>Sending Emergency Signal...</Text>

          {cancelEnabled && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel SOS</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>SOS Sent Successfully!</Text>
          <Text style={styles.subText}>Stay calm. Help is on the way.</Text>

          <TouchableOpacity style={styles.backButton} onPress={handleBackHome}>
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// (keep your existing styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: COLORS.lighBlue,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successIcon: {
    fontSize: 60,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 10,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});