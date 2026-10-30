import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { estimateFuelLitres, parseFuelRate } from '@/utils/routeEstimate';

type FuelEstimateModalProps = {
  visible: boolean;
  onClose: () => void;
  distance: number | null;
};

export default function FuelEstimateModal({
  visible,
  onClose,
  distance,
}: FuelEstimateModalProps) {
  const [fuelRate, setFuelRate] = useState('');
  const rate = parseFuelRate(fuelRate);
  const fuelNeeded = estimateFuelLitres(distance, rate);
  const validDistance =
    typeof distance === 'number' && Number.isFinite(distance) && distance >= 0;
  const formatAmount = (value: number) =>
    value > 0 && value < 0.01 ? '<0.01' : value.toFixed(2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.distanceText}>
            {validDistance
              ? `Approximate direct distance: ${formatAmount(distance)} nm (one way)`
              : 'Distance unavailable'}
          </Text>
          <Text>
            Enter your boat's measured fuel use in litres per nautical mile.
          </Text>
          <TextInput
            value={fuelRate}
            onChangeText={setFuelRate}
            keyboardType="decimal-pad"
            accessibilityLabel="Fuel rate in litres per nautical mile"
            placeholder="Fuel rate (L/nm)"
            maxLength={12}
            style={styles.rateInput}
          />
          <View style={styles.fuelRow}>
            <FontAwesome name="tint" size={28} color="black" />
            <Text style={styles.fuelText} accessibilityLiveRegion="polite">
              {fuelNeeded === null
                ? 'Fuel estimate unavailable'
                : `Estimated fuel: ${formatAmount(fuelNeeded)} L`}
            </Text>
          </View>
          {fuelRate.trim() && rate === null && (
            <Text>Enter a positive decimal fuel rate.</Text>
          )}
          <Text style={styles.noteText}>
            Direct distance does not check land, depth, weather or a navigable
            route. Fuel excludes the return trip, reserve and idling.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close estimate"
            >
              <View style={styles.okBtn}>
                <Text style={styles.okBtnText}>OKAY</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
  },
  distanceText: {
    fontSize: 16,
    marginBottom: 15,
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 12,
    marginVertical: 12,
    width: '100%',
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fuelText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  settingsBtn: {
    fontSize: 16,
    color: '#333',
    padding: 8,
  },
  okBtn: {
    backgroundColor: '#5c6b70',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  okBtnText: {
    color: '#fff',
    fontSize: 16,
  },
});
