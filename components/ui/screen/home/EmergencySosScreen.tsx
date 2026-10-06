import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { COLORS } from "@/constants/ColorPallet";
import api from "@/utils/api";

type Phase = "ready" | "locating" | "submitting" | "recorded" | "error";
type SosReceipt = {
  id: string;
  receivedAt: string | null;
  status: "recorded";
  responderNotified: false;
  alreadyActive: boolean;
};

export default function EmergencySosScreen({ navigation }: any) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [receipt, setReceipt] = useState<SosReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [locationDenied, setLocationDenied] = useState(false);

  const sendSos = async () => {
    let requestStarted = false;
    setErrorMessage("");
    setLocationDenied(false);
    setPhase("locating");

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        setErrorMessage("Location permission is required. No SOS request was submitted.");
        setPhase("error");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setPhase("submitting");
      requestStarted = true;
      const response = await api.post("sosAlerts/sos", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const recorded = response.data?.data as SosReceipt | undefined;
      if (!response.data?.success || recorded?.status !== "recorded" || !recorded.id) {
        throw new Error("Invalid SOS receipt");
      }
      setReceipt(recorded);
      setPhase("recorded");
    } catch {
      setErrorMessage(
        requestStarted
          ? "Could not confirm whether the server recorded your request. You can retry; an existing active request will be returned if one was saved."
          : "Could not get your current location. No SOS request was submitted. Check location services and try again."
      );
      setPhase("error");
    }
  };

  const confirmSend = () => {
    Alert.alert(
      "Record an SOS request?",
      "OceanPulse only records this request on its server. No responder or emergency service is notified. Contact your local emergency service directly.",
      [
        { text: "Go back", style: "cancel" },
        { text: "Record request", onPress: sendSos },
      ]
    );
  };

  const receivedAt = receipt?.receivedAt && !Number.isNaN(Date.parse(receipt.receivedAt))
    ? new Date(receipt.receivedAt).toLocaleString()
    : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {phase === "ready" && (
        <>
          <Text style={styles.title}>SOS request</Text>
          <Text style={styles.body}>
            Record your current location with the OceanPulse server. This prototype does not dispatch rescue or notify a responder.
          </Text>
          <Text style={styles.guidance}>If you need urgent help, contact your local emergency service directly.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={confirmSend} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Record SOS request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Back to home</Text>
          </TouchableOpacity>
        </>
      )}

      {(phase === "locating" || phase === "submitting") && (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.title}>{phase === "locating" ? "Getting your location" : "Recording your request"}</Text>
          <Text style={styles.body}>
            {phase === "locating"
              ? "Your request has not been submitted yet."
              : "Waiting for confirmation from the OceanPulse server. Closing this screen will not cancel the request."}
          </Text>
        </>
      )}

      {phase === "recorded" && receipt && (
        <>
          <Text style={styles.title}>Request recorded on server</Text>
          <Text style={styles.body}>
            {receipt.alreadyActive
              ? "Your existing active SOS request was found. A second request was not created."
              : "The OceanPulse server saved your SOS request."}
          </Text>
          <Text style={styles.receipt}>Receipt ID: {receipt.id}</Text>
          {receivedAt && <Text style={styles.receipt}>Recorded: {receivedAt}</Text>}
          <Text style={styles.guidance}>
            No responder or emergency service has been notified by OceanPulse. Contact your local emergency service directly if you need help.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Back to home</Text>
          </TouchableOpacity>
        </>
      )}

      {phase === "error" && (
        <>
          <Text style={styles.title}>SOS receipt unavailable</Text>
          <Text style={styles.body}>{errorMessage}</Text>
          <Text style={styles.guidance}>Do not rely on this app for emergency help. Contact your local emergency service directly.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={confirmSend} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
          {locationDenied && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openSettings()} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Open device settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Back to home</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 16,
  },
  body: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 16,
  },
  guidance: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 24,
  },
  receipt: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 10,
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 14,
    padding: 12,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
  },
});
