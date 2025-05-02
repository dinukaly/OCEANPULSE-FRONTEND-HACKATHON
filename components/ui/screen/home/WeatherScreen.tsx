import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import getBaseUrl from "@/constants/BASEURL";
import api from '@/utils/api';

interface WeatherData {
    name: string;
    weather: Array<{
        description: string;
        icon: string;
    }>;
    main: {
        temp: number;
        humidity: number;
    };
    clouds: {
        all: number;
    };
    wind: {
        speed: number;
    };
}

export default function WeatherScreen() {
    const [city, setCity] = useState('Kalpitiya');
    const [searchCity, setSearchCity] = useState('');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = async (cityName: string) => {
        if (!cityName.trim()) {
            setError('Please enter a city name');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await api.get('weatherLogs/weather', {
                params: { city: cityName }
            });
            
            // Check if response has data property
            if (res.data && res.data.data) {
                setWeatherData(res.data.data);
            } else {
                setError('No weather data available');
            }
        } catch (err: any) {
            console.error('Weather API Error:', err);
            if (err.response?.status === 404) {
                setError('City not found. Please check the city name.');
            } else if (err.response?.status === 500) {
                setError('Server error. Please try again later.');
            } else {
                setError('Failed to fetch weather data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather(city);
    }, []);

    const handleSearch = () => {
        if (searchCity.trim() !== '') {
            setCity(searchCity);
            fetchWeather(searchCity);
            setSearchCity('');
        } else {
            setError('Please enter a city name');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <TextInput
                    placeholder="Enter city name"
                    value={searchCity}
                    onChangeText={(text) => {
                        setSearchCity(text);
                        setError(null);
                    }}
                    style={styles.searchInput}
                />
                <TouchableOpacity onPress={handleSearch}>
                    <Ionicons name="search" size={24} color="#0456C7" />
                </TouchableOpacity>
            </View>

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#0456C7" style={styles.loader} />
            ) : weatherData ? (
                <>
                    <View style={styles.header}>
                        <Ionicons name="location-sharp" size={18} color="#0456C7" style={{ marginRight: 6 }} />
                        <Text style={styles.locationText}>{weatherData.name}</Text>
                    </View>

                    <Text style={styles.dateText}>{new Date().toDateString()}</Text>

                    <View style={styles.weatherCard}>
                        <Image
                            source={{ uri:`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}}
                            style={styles.weatherIcon}
                        />
                        <View style={styles.weatherRow}>
                            <Text style={styles.celciusText}>°C</Text>
                            <Text style={styles.tempText}>{Math.round(weatherData.main.temp)}</Text>
                            <Text style={styles.cloudText}>{weatherData.weather[0].description}</Text>
                        </View>
                    </View>

                    <View style={styles.detailsCard}>
                        <View style={styles.detailBox}>
                            <Ionicons name="water" size={40} color="#0456C7" />
                            <Text style={styles.detailText}>{weatherData.main.humidity}%</Text>
                            <Text style={styles.detailLabel}>Humidity</Text>
                        </View>
                        <View style={styles.detailBox}>
                            <Ionicons name="rainy" size={40} color="#0456C7" />
                            <Text style={styles.detailText}>{weatherData.clouds.all}%</Text>
                            <Text style={styles.detailLabel}>Cloudiness</Text>
                        </View>
                        <View style={styles.detailBox}>
                            <Ionicons name="navigate" size={40} color="#0456C7" />
                            <Text style={styles.detailText}>{weatherData.wind.speed} km/h</Text>
                            <Text style={styles.detailLabel}>Wind</Text>
                        </View>
                    </View>
                </>
            ) : null}
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
