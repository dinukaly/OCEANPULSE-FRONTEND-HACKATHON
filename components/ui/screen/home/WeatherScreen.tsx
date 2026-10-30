import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { formatUtc, formatValue, readWeather, weatherFreshness } from '@/utils/conditions';
import useConditionRequest from '@/utils/useConditionRequest';
import useConditionsClock from '@/utils/useConditionsClock';

export default function WeatherScreen() {
    const [searchCity, setSearchCity] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const { data: weatherData, loading, error: requestError, load } = useConditionRequest('weatherLogs/weather', readWeather);
    const now = useConditionsClock();
    const error = validationError || requestError;
    const freshness = weatherData ? weatherFreshness(weatherData, now) : null;
    const handleSearch = () => {
        const city = searchCity.trim();
        if (!city) { setValidationError('Please enter a city name, optionally followed by a country code.'); return; }
        setValidationError(null);
        void load({ city });
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <TextInput placeholder="City, country code" value={searchCity} maxLength={100}
                    onChangeText={value => { setSearchCity(value); setValidationError(null); }} style={styles.searchInput} />
                <TouchableOpacity onPress={handleSearch} accessibilityRole="button" accessibilityLabel="Search weather">
                    <Ionicons name="search" size={24} color="#0456C7" />
                </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {loading ? <ActivityIndicator size="large" color="#0456C7" style={styles.loader} /> : weatherData ? (
                <>
                    <View style={styles.header}>
                        <Ionicons name="location-sharp" size={18} color="#0456C7" style={{ marginRight: 6 }} />
                        <Text style={styles.locationText}>{weatherData.location.name || 'Selected location'}{weatherData.location.country ? `, ${weatherData.location.country}` : ''}</Text>
                    </View>
                    <Text style={styles.dateText}>
                        Returned location: {weatherData.location.latitude.toFixed(4)}, {weatherData.location.longitude.toFixed(4)}
                    </Text>
                    <Text style={styles.dateText}>{weatherData.dataTime ? `Data time: ${formatUtc(weatherData.dataTime)}` : 'Data time unavailable'}</Text>
                    <Text style={styles.dateText}>Retrieved: {formatUtc(weatherData.fetchedAt)}</Text>
                    {freshness === 'stale' && <Text style={styles.errorText}>Weather data is over one hour old. Search again to refresh.</Text>}
                    {freshness === 'unknown' && <Text style={styles.errorText}>Data age cannot be verified. Check the source time and device clock.</Text>}
                    {!weatherData.available && <Text style={styles.errorText}>Weather measurements are unavailable for this location.</Text>}
                    <View style={styles.weatherCard}>
                        {weatherData.icon && <Image source={{ uri: `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png` }} style={styles.weatherIcon} />}
                        <View style={styles.weatherRow}>
                            <Text style={styles.celciusText}>°C</Text>
                            <Text style={weatherData.temperatureC === null ? styles.detailText : styles.tempText}>{weatherData.temperatureC === null ? 'Unavailable' : Math.round(weatherData.temperatureC)}</Text>
                            <Text style={styles.cloudText}>{weatherData.description || 'Description unavailable'}</Text>
                        </View>
                    </View>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailBox}>
                            <Ionicons name="water" size={40} color="#0456C7" />
                            <Text style={styles.detailText}>{formatValue(weatherData.humidityPercent, '%')}</Text>
                            <Text style={styles.detailLabel}>Humidity</Text>
                        </View>
                        <View style={styles.detailBox}>
                            <Ionicons name="rainy" size={40} color="#0456C7" />
                            <Text style={styles.detailText}>{formatValue(weatherData.cloudCoverPercent, '%')}</Text>
                            <Text style={styles.detailLabel}>Cloudiness</Text>
                        </View>
                        <View style={styles.detailBox}>
                            <Ionicons name="navigate" size={40} color="#0456C7" />
                            <Text style={styles.detailText}>{formatValue(weatherData.windSpeedMps, 'm/s')}</Text>
                            <Text style={styles.detailLabel}>Wind</Text>
                        </View>
                    </View>
                    <Text style={styles.dateText} accessibilityRole="link" onPress={() => Linking.openURL(weatherData.source.url)}>{weatherData.source.attribution}</Text>
                </>
            ) : !error && <Text style={styles.dateText}>Search for a city to load weather. No default location is selected.</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    loader: {
        marginTop: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    locationText: {
        color: "#0456C7",
        fontSize: 20,
        fontWeight: "700",
    },
    dateText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginVertical: 8,
    },
    weatherCard: {
        width: 300,
        height: 200,
        backgroundColor: "#0456C7C9",
        borderRadius: 20,
        padding: 20,
        marginVertical: 20,
        marginLeft: 30,
    },
    weatherRow: {
        marginLeft: 100,
        flexDirection: "column",
        height: 150,
    },
    tempText: {
        color: "#fff",
        fontSize: 100,
        fontWeight: "bold",
        marginLeft: 30,
        marginTop: -20,
    },
    celciusText: {
        color: "#fff",
        fontSize: 30,
        marginLeft: 120,
    },
    cloudText: {
        color: "#fff",
        fontSize: 16,
        marginTop: 4,
        marginLeft: 20,
    },
    weatherIcon: {
        width: 150,
        height: 150,
        resizeMode: "contain",
        position: "absolute",
        top: 75,
        left: -40,
    },
    detailsCard: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#9CC5FF47",
        height: 150,
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
    },
    detailBox: {
        alignItems: "center",
    },
    detailText: {
        fontWeight: "bold",
        fontSize: 20,
    },
    detailLabel: {
        fontSize: 15,
        color: "#666",
    },
});
