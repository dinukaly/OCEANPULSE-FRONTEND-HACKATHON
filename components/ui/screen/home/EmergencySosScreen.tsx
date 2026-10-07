import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text } from "react-native";
import * as Location from "expo-location";
import ActionButton from "@/components/ui/ActionButton";
import StatusBanner from "@/components/ui/StatusBanner";
import { theme } from "@/constants/theme";
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
          <Text style={styles.title} accessibilityRole="header">SOS request</Text>
          <StatusBanner
            tone="warning"
            title="No rescue dispatch"
            message="OceanPulse can record your location on its server, but it does not notify a responder or emergency service."
            style={styles.banner}
          />
          <Text style={styles.guidance}>If you need urgent help, contact your local emergency service directly.</Text>
          <ActionButton label="Record SOS request" variant="danger" onPress={confirmSend} style={styles.primaryAction} />
          <ActionButton label="Back to home" variant="secondary" onPress={() => navigation.goBack()} style={styles.secondaryAction} />
        </>
      )}

      {(phase === "locating" || phase === "submitting") && (
        <>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {phase === "locating" ? "Getting your location" : "Recording your request"}
          </Text>
          <Text style={styles.body}>
            {phase === "locating"
              ? "Your request has not been submitted yet."
              : "Waiting for confirmation from the OceanPulse server. Closing this screen will not cancel the request."}
          </Text>
        </>
      )}

      {phase === "recorded" && receipt && (
        <>
          <Text style={styles.title} accessibilityRole="header">Request recorded on server</Text>
          <Text style={styles.body}>
            {receipt.alreadyActive
              ? "Your existing active SOS request was found. A second request was not created."
              : "The OceanPulse server saved your SOS request."}
          </Text>
          <Text style={styles.receipt} selectable>Receipt ID: {receipt.id}</Text>
          {receivedAt && <Text style={styles.receipt}>Recorded: {receivedAt}</Text>}
          <StatusBanner
            tone="warning"
            title="No responder notified"
            message="OceanPulse has not contacted an emergency service. Contact your local emergency service directly if you need help."
            style={styles.banner}
          />
          <ActionButton label="Back to home" onPress={() => navigation.goBack()} style={styles.primaryAction} />
        </>
      )}

      {phase === "error" && (
        <>
          <Text style={styles.title} accessibilityRole="header">SOS receipt unavailable</Text>
          <StatusBanner tone="error" title="Receipt not confirmed" message={errorMessage} style={styles.banner} />
          <Text style={styles.guidance}>Do not rely on this app for emergency help. Contact your local emergency service directly.</Text>
          <ActionButton label="Try again" onPress={confirmSend} style={styles.primaryAction} />
          {locationDenied && (
            <ActionButton label="Open device settings" variant="secondary" onPress={() => Linking.openSettings()} style={styles.secondaryAction} />
          )}
          <ActionButton label="Back to home" variant="secondary" onPress={() => navigation.goBack()} style={styles.secondaryAction} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.type.title,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
  body: {
    fontSize: theme.type.body,
    color: theme.colors.mutedText,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
  guidance: {
    fontSize: theme.type.body,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  receipt: {
    fontSize: theme.type.caption,
    color: theme.colors.mutedText,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  banner: {
    marginTop: theme.spacing.lg,
  },
  primaryAction: {
    marginTop: theme.spacing.lg,
  },
  secondaryAction: {
    marginTop: theme.spacing.sm,
  },
});
