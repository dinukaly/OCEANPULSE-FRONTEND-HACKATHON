import React, { useRef } from "react";
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text } from "react-native";
import ActionButton from "@/components/ui/ActionButton";
import StatusBanner from "@/components/ui/StatusBanner";
import { theme } from "@/constants/theme";
import useSosRequest from "@/utils/useSosRequest";

export default function EmergencySosScreen({ navigation }: any) {
  const { phase, receipt, errorMessage, locationDenied, uncertain, send, checkReceipt } = useSosRequest();
  const confirmationOpen = useRef(false);
  const confirmSend = () => {
    if (confirmationOpen.current || (phase !== "ready" && phase !== "error")) return;
    confirmationOpen.current = true;
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.confirm('Record an SOS request? OceanPulse only records this request. No responder or emergency service is notified. Contact your local emergency service directly.')) void send();
      } finally { confirmationOpen.current = false; }
      return;
    }
    Alert.alert(
      "Record an SOS request?",
      "OceanPulse only records this request on its server. No responder or emergency service is notified. Contact your local emergency service directly.",
      [
        { text: "Go back", style: "cancel", onPress: () => { confirmationOpen.current = false; } },
        { text: "Record request", onPress: () => { confirmationOpen.current = false; void send(); } },
      ],
      { cancelable: true, onDismiss: () => { confirmationOpen.current = false; } }
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
          <ActionButton label="Check existing receipt" variant="secondary" onPress={checkReceipt} style={styles.secondaryAction} />
          <ActionButton label="Back to home" variant="secondary" onPress={() => navigation.goBack()} style={styles.secondaryAction} />
        </>
      )}

      {(phase === "locating" || phase === "submitting" || phase === "checking") && (
        <>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {phase === "locating" ? "Getting your location" : phase === "checking" ? "Checking server receipt" : "Recording your request"}
          </Text>
          <Text style={styles.body}>
            {phase === "locating"
              ? "Your request has not been submitted yet."
              : phase === "checking" ? "Checking for an existing record. This check does not submit or cancel a request."
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
          {receivedAt ? <Text style={styles.receipt}>Recorded: {receivedAt}</Text> : <Text style={styles.receipt}>Recorded time unavailable</Text>}
          {receipt.location ? <Text style={styles.receipt}>Recorded location: {receipt.location.latitude}, {receipt.location.longitude}</Text>
            : <Text style={styles.receipt}>Recorded location unavailable</Text>}
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
          <StatusBanner tone="error" title={uncertain ? "Submission outcome unknown" : "Receipt not confirmed"} message={errorMessage} style={styles.banner} />
          <Text style={styles.guidance}>Do not rely on this app for emergency help. Contact your local emergency service directly.</Text>
          <ActionButton label={uncertain ? "Retry same request" : "Try again"} onPress={confirmSend} style={styles.primaryAction} />
          <ActionButton label="Check server receipt" variant="secondary" onPress={checkReceipt} style={styles.secondaryAction} />
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
