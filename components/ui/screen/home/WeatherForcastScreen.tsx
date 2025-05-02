import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";

import { Ionicons } from '@expo/vector-icons';

export default function WeatherForcastScreen() {
  const forecastData = [
    { day: "Tuesday", condition: "Mostly Clear", temp: "23°", icon: require("@/assets/images/Weather.png") },
    { day: "Wednesday", condition: "Gloomy", temp: "19°", icon: require("@/assets/images/Weather.png") },
    { day: "Thursday", condition: "Mostly Clear", temp: "25°", icon: require("@/assets/images/Weather.png") },
    { day: "Friday", condition: "Rainy", temp: "15°", icon: require("@/assets/images/Weather.png") },
    { day: "Saturday", condition: "Mostly Clear", temp: "23°", icon: require("@/assets/images/Weather.png") },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={24} color="#0456C7" />
        <Text style={styles.headerTitle}>7 Day Forecast</Text>
      </View>
      <Text style={styles.subTitle}>Tomorrow</Text>

      <View style={styles.mainCard}>
        <View style={styles.weatherTop}>
          <Image source={require("@/assets/images/Weather.png")} style={styles.mainIcon} />
          <View style={styles.tempBlock}>
            <Text style={styles.tempText}>15</Text>
            <Text style={styles.celsius}>°C</Text>
          </View>
        </View>
        <Text style={styles.conditionText}>Heavy Storm</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Image source={require("@/assets/images/Weather.png")} style={styles.metricIcon} />
            <Text style={styles.metricValue}>45%</Text>
            <Text style={styles.metricLabel}>Precipitation</Text>
          </View>
          <View style={styles.metricBox}>
            <Image source={require("@/assets/images/Weather.png")} style={styles.metricIcon} />
            <Text style={styles.metricValue}>45%</Text>
            <Text style={styles.metricLabel}>Humidity</Text>
          </View>
          <View style={styles.metricBox}>
            <Image source={require("@/assets/images/Weather.png")} style={styles.metricIcon} />
            <Text style={styles.metricValue}>12km/h</Text>
            <Text style={styles.metricLabel}>Wind</Text>
          </View>
        </View>
      </View>

      <View style={styles.forecastList}>
        {forecastData.map((item, index) => (
          <View key={index} style={styles.forecastRow}>
            <Text style={styles.forecastDay}>{item.day}</Text>
            <View style={styles.rowContent}>
              <Image source={item.icon} style={styles.rowIcon} />
              <Text style={styles.rowCondition}>{item.condition}</Text>
            </View>
            <Text style={styles.rowTemp}>{item.temp}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    // flexWrap:'wrap'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0456C7',
    marginLeft: 12,
  },
  subTitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginVertical: 8,
  },
  mainCard: {
    backgroundColor: '#D0E4FF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  weatherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  tempBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempText: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
  },
  celsius: {
    fontSize: 24,
    color: '#fff',
    marginTop: 10,
  },
  conditionText: {
    fontSize: 16,
    color: '#004AAD',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  metricValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  forecastList: {
    backgroundColor: '#E4F0FF',
    borderRadius: 20,
    padding: 10,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  forecastDay: {
    fontSize: 16,
    color: '#666',
    width: 90,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowIcon: {
    width: 24,
    height: 24,
  },
  rowCondition: {
    fontSize: 14,
    color: '#666',
  },
  rowTemp: {
    fontSize: 16,
    color: '#666',
  },
});
