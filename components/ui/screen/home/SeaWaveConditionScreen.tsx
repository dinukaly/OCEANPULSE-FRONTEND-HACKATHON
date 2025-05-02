import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/ColorPallet';
import axios from 'axios';
import getBaseUrl from '@/constants/BASEURL';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/utils/api';




type WaveEntry = {
    time: string;
    wave_height: number;
};

type Props = {
    latitude: number;
    longitude: number;
    selectedDate: string;
};



const SeaWaveConditionScreen: React.FC<Props> = ({ latitude, longitude, selectedDate}) => {
    const [waveData, setWaveData] = useState<WaveEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [currentWaveHeight, setCurrentWaveHeight] = useState<number>(0);

    const currentHour = new Date(selectedDate).getHours();

    useEffect(() => {
        const fetchWaveData = async () => {
            try {
                const response = await axiosInstance.get<{ success: boolean; data?: { hourly: WaveEntry[] } }>(
                    `${getBaseUrl()}riskPredictions/risk-prediction`,
                    {
                        params: {
                            latitude: 54.544587,
                            longitude: 10.227487
                        },
                    }
                );
    
           
    
                const hourlyData = response.data?.data?.hourly;
    
                if (hourlyData && hourlyData.length > 0) {
                    setCurrentWaveHeight(hourlyData[0].wave_height);
                    setWaveData(hourlyData);
                } else {
           
                    setError('No wave data available');
                }
            } catch (err) {
                setError('Failed to fetch wave data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchWaveData();
    }, [latitude, longitude, selectedDate]);

    const getWaveStatus = (height: number): string => {
        if (height < 0.5) return 'Calm';
        if (height < 1.5) return 'Moderate Waves';
        if (height < 2.5) return 'High Waves';
        return 'Very High Waves';
    };

    const getStatusColor = (height: number): string => {
        if (height < 0.5) return '#4CAF50'; // Green
        if (height < 1.5) return '#FFC107'; // Amber
        if (height < 2.5) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (waveData.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No data available</Text>
            </View>
        );
    }

    // Get next 3 hours data
    const nextHoursData = waveData.slice(0, 3);

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerMenuIcon}>
                <Icon size={25} source="dots-vertical" color="#706D6D" />
            </View>

            <View>
                <Text style={styles.headerLabel}>Sea Wave Condition</Text>
                <Text style={styles.dateLabel}>{formatDate(waveData[0].time)}</Text>
            </View>

            {/* Current Wave Condition */}
            <LinearGradient
                colors={['#D9D9D9', 'rgba(4, 86, 199, 0.4)']}
                locations={[0, 0.8, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.middleContainer}
            >
                <Text style={styles.waveHeightText}>{currentWaveHeight.toFixed(1)} m</Text>
                <TouchableOpacity
                    style={[styles.middleContainerBtn, { backgroundColor: getStatusColor(currentWaveHeight) }]}
                >
                    <Text style={styles.statusText}>{getWaveStatus(currentWaveHeight)}</Text>
                </TouchableOpacity>
                <Text style={styles.suitabilityText}>
                    {currentWaveHeight < 1.5
                        ? 'Suitable for all fishermen'
                        : currentWaveHeight < 2.5
                            ? 'Suitable for experienced fishermen'
                            : 'Not recommended for fishing'}
                </Text>
            </LinearGradient>

            {/* Next Hours Forecast */}
            <View style={styles.footerSection}>
                <View style={styles.sectionHeader}>
                    <Icon size={30} source="clock-time-five" color={COLORS.primaryTextBlueColor} />
                    <Text style={styles.sectionHeaderText}>Next 3 Hours</Text>
                </View>

                {/* Forecast Cards */}
                <View style={styles.middleCards}>
                    {nextHoursData.map((hour, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTimeText}>
                                {new Date(hour.time).toLocaleTimeString([], { hour: '2-digit' })}
                            </Text>
                            <Text style={styles.cardHeightText}>{hour.wave_height.toFixed(1)} m</Text>
                        </View>
                    ))}
                </View>

                {/* Warning and Actions */}
                <View style={styles.footerLabels}>
                    {currentWaveHeight > 2.5 && (
                        <View style={styles.warningLabel}>
                            <Icon size={30} source="alert" color={COLORS.primary} />
                            <Text style={styles.warningText}>
                                High waves expected. Consider returning to shore soon.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.emergencySosBtn}>
                        <Text style={styles.buttonText}>Emergency SOS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reportConditionBtn}>
                        <Icon size={30} source="pencil-box-multiple-outline" color={COLORS.primaryBlack} />
                        <Text style={styles.reportButtonText}>Report Conditions</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    headerLabel: {
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.primaryTextBlueColor,
        textAlign: 'center',
    },
    dateLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#706D6D',
        textAlign: 'center',
    },
    headerMenuIcon: {
        alignItems: 'center',
        width: 50,
        marginTop: 15,
        borderRadius: 10,
        alignSelf: 'flex-end',
    },
    middleContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 200,
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 20,
    },
    waveHeightText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: 'black',
    },
    middleContainerBtn: {
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
    },
    statusText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 20,
    },
    suitabilityText: {
        color: '#565555',
        marginTop: 20,
        fontSize: 17,
    },
    footerSection: {
        flex: 1,
        width: '100%',
        padding: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    sectionHeaderText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primaryTextBlueColor,
        marginLeft: 10,
    },
    middleCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 20,
        width: '100%',
        height: 160,
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.primaryGray,
        borderRadius: 20,
        width: '30%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTimeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primaryTextColor,
    },
    cardHeightText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.primaryTextColor,
    },
    footerLabels: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    warningLabel: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#F217171C',
        borderRadius: 10,
        width: '100%',
        height: 60,
        margin: 10,
        padding: 10,
    },
    warningText: {
        fontSize: 17,
        color: COLORS.primaryBlack,
        marginLeft: 10,
        paddingRight: 15,
    },
    emergencySosBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        padding: 10,
        height: 60,
        width: '100%',
    },
    reportConditionBtn: {
        flexDirection: 'row',
        backgroundColor: '#E9E8E8',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        padding: 10,
        height: 60,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },

    reportButtonText: {
        color: COLORS.primaryBlack,
        fontWeight: 'bold',
        fontSize: 20,
        marginLeft: 10,
    },
    errorText: {
        fontSize: 18,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 20,
    },
    
});

export default SeaWaveConditionScreen;