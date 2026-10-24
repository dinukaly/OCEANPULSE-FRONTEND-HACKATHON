import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { COLORS } from '@/constants/ColorPallet';
import { formatUtc, formatValue, marineCoordinates, readMarine, selectedInstant, selectForecast } from '@/utils/conditions';
import useConditionRequest from '@/utils/useConditionRequest';
import useConditionsClock from '@/utils/useConditionsClock';

type Props = { latitude?: number; longitude?: number; selectedDate?: string };

const SeaWaveConditionScreen: React.FC<Props> = ({ latitude, longitude, selectedDate }) => {
    const { data, loading, error, load, cancel } = useConditionRequest('riskPredictions/risk-prediction', readMarine);
    const now = useConditionsClock();
    const reload = () => load(() => marineCoordinates(latitude, longitude, Location));
    useEffect(() => {
        void load(() => marineCoordinates(latitude, longitude, Location));
        return cancel;
    }, [latitude, longitude, load, cancel]);
    const selectedTime = selectedInstant(selectedDate, now);
    const forecast = selectForecast(data?.hourly || [], selectedTime);
    const retry = <TouchableOpacity onPress={reload} accessibilityRole="button"><Text>Refresh marine forecast</Text></TouchableOpacity>;
    if (loading) return <View style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} /><Text>Loading location and marine forecast...</Text></View>;
    if (error || !data) return <View style={styles.container}><Text style={styles.errorText}>{error || 'Marine forecast unavailable'}</Text>{retry}</View>;
    return (
        <View style={styles.container}>
            <Text style={styles.headerLabel}>Sea Wave Forecast</Text>
            <Text style={styles.dateLabel}>Requested: {data.requestedLocation.latitude.toFixed(4)}, {data.requestedLocation.longitude.toFixed(4)}</Text>
            <Text style={styles.dateLabel}>Forecast grid: {data.location.latitude.toFixed(4)}, {data.location.longitude.toFixed(4)}</Text>
            <Text style={styles.dateLabel}>Retrieved: {formatUtc(data.fetchedAt)}</Text>
            <Text style={styles.dateLabel}>Model issue time unavailable; retrieval time does not establish model freshness.</Text>
            {now >= Date.parse(data.refreshAfter) && <Text style={styles.errorText}>This forecast was retrieved over one hour ago. Refresh before relying on it.</Text>}
            {!Number.isFinite(selectedTime) && <Text style={styles.errorText}>Selected time requires an explicit time zone.</Text>}
            {!data.available && <Text style={styles.errorText}>Wave heights are unavailable for this forecast grid.</Text>}
            {!forecast.selected ? <Text style={styles.errorText}>No forecast hour covers the selected time.</Text> : (
                <>
                    <Text style={styles.dateLabel}>Forecast hour: {formatUtc(forecast.selected.time)}</Text>
                    <LinearGradient colors={['#D9D9D9', 'rgba(4, 86, 199, 0.4)']} locations={[0, 0.8, 1]}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.middleContainer}>
                        <Text style={forecast.selected.waveHeightM === null ? styles.errorText : styles.waveHeightText}>{formatValue(forecast.selected.waveHeightM, 'm')}</Text>
                        <Text style={styles.suitabilityText}>Significant wave height forecast. No fishing suitability assessment.</Text>
                    </LinearGradient>
                    <View style={styles.footerSection}>
                        <View style={styles.sectionHeader}>
                            <Icon size={30} source="clock-time-five" color={COLORS.primaryTextBlueColor} />
                            <Text style={styles.sectionHeaderText}>Following forecast hours (UTC)</Text>
                        </View>
                        <View style={styles.middleCards}>
                            {forecast.next.map(hour => <View key={hour.time} style={styles.card}>
                                <Text style={styles.cardTimeText}>{formatUtc(hour.time)}</Text>
                                <Text style={hour.waveHeightM === null ? styles.dateLabel : styles.cardHeightText}>{formatValue(hour.waveHeightM, 'm')}</Text>
                            </View>)}
                        </View>
                        {!forecast.next.length && <Text>No later forecast hours available.</Text>}
                    </View>
                </>
            )}
            <Text style={styles.dateLabel} accessibilityRole="link" onPress={() => Linking.openURL(data.source.url)}>{data.source.attribution}</Text>
            {retry}
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
