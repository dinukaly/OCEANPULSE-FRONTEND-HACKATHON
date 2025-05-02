import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const FuelEstimateModal = ({ visible, onClose, distance, fuelRate }:any) => {
  const fuelNeeded = (distance * fuelRate).toFixed(3); // e.g. 0.5 L/nm

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.distanceText}>{distance} nm To sail you need</Text>
          <View style={styles.fuelRow}>
            <FontAwesome name="truck" size={28} color="black" />
            <Text style={styles.fuelText}>  {fuelNeeded} Liters</Text>
          </View>
          <Text style={styles.noteText}>
            (Figures appearing are roughly calculated)
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose}>
              <View style={styles.okBtn}>
                <Text style={styles.okBtnText}>OKAY</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FuelEstimateModal;

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
