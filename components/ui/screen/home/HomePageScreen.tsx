import { COLORS } from "@/constants/ColorPallet";
import React, { useState, useEffect } from "react";
import {
    Text, View, StyleSheet, TouchableOpacity, ScrollView, Modal, AppState, Linking, Platform, BackHandler,
    Alert
} from "react-native";
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from "react-native-paper";
import { useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";


export default function HomePageScreen({ navigation }: any) {
    const [username, setUsername] = useState('');
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);

    useEffect(() => {
        const loadUsername = async () => {
            const storedUsername = await AsyncStorage.getItem('username');
            const storedToken = await AsyncStorage.getItem('token');
            setUsername(storedUsername || 'User');
            console.log('token:', storedToken);
            if (!storedToken) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        };
        loadUsername();
    }, []);

    useEffect(() => {
        checkLocationEnabled();

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, []);

    const handleAppStateChange = (nextAppState: any) => {
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
            checkLocationEnabled();
        }
        setAppState(nextAppState);
    };

    const checkLocationEnabled = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status === Location.PermissionStatus.GRANTED) {
            let location = await Location.getCurrentPositionAsync({});
            if (location) {
                console.log('Location is enabled:', location);
                setLocationModalVisible(false);
            } else {
                console.log('GPS is OFF');
                setLocationModalVisible(true);
            }
        } else {
            const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

            if (newStatus === Location.PermissionStatus.GRANTED) {
                let location = await Location.getCurrentPositionAsync({});
                if (location) {
                    console.log('Location is enabled:', location);
                    setLocationModalVisible(false);
                } else {
                    console.log('GPS is OFF after permission');
                    setLocationModalVisible(true);
                }
            } else {
                console.log('Permission denied. Show modal.');
                setLocationModalVisible(true);
            }
        }
    };

    const handleOpenSettings = () => {
        Linking.openSettings();
    };

    const handleExitApp = () => {
        BackHandler.exitApp();
    };

    const dispatch = useDispatch();
    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user', 'userId', 'username']);
            dispatch(logout());
            // No need to navigate 
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>OCEAN PULSE</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Icon source="logout" size={24} color={COLORS.lighBlue} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>Hello {username}!</Text>
                    <Text style={styles.greetingSubtext}>Fish smart, Navigate safe</Text>
                </View>

                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('WeatherScreen')}
                            style={[styles.btn, styles.weatherBtn]}>
                            <View style={styles.btnContent}>
                                <Icon size={40} source="umbrella" color={COLORS.background} />
                                <Text style={styles.btnText}>Live Weather</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.sosBtn]}
                            onPress={() => navigation.navigate('SOSSCREEN')}
                        >
                            <View style={styles.btnContent}>
                                <Icon size={40} source="satellite-uplink" color={COLORS.background} />
                                <Text style={styles.btnText}>Emergency SOS</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gridRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('RouteScreen')}
                            style={[styles.btn, styles.routeBtn]}
                        >
                            <View style={styles.btnContent}>
                                <Icon size={40} source="routes" color={COLORS.background} />
                                <Text style={styles.btnText}>My Route</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('UserListScreen')}
                            style={[styles.btn, styles.boatBtn]}
                        >
                            <View style={styles.btnContent}>
                                <Icon size={40} source="sail-boat" color={COLORS.background} />
                                <Text style={styles.btnText}>Boat to Boat</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gridRow}>
                        <TouchableOpacity style={[styles.btn, styles.waveBtn]}>
                            <View style={styles.btnContent}>
                                <Icon size={40} source="waves" color={COLORS.background} />
                                <Text style={styles.btnText}>Sea Conditions</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.btn, styles.communityBtn]}>
                            <View style={styles.btnContent}>
                                <Icon size={40} source="account-group" color={COLORS.background} />
                                <Text style={styles.btnText}>Community</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.footerTitle}>Fishermen Resources</Text>

                <View style={styles.resourceGrid}>
                    <TouchableOpacity
                        style={styles.resourceItem}
                        onPress={() => Linking.openURL('https://www.fisheries.noaa.gov')}
                    >
                        <Icon source="web" size={24} color={COLORS.lighBlue} />
                        <Text style={styles.resourceText}>NOAA Fisheries</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resourceItem}
                        onPress={() => Linking.openURL('tel:911')}
                    >
                        <Icon source="phone" size={24} color={COLORS.lighBlue} />
                        <Text style={styles.resourceText}>Emergency: 911</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resourceItem}
                        onPress={() => Linking.openURL('https://www.weather.gov/marine')}
                    >
                        <Icon source="weather-cloudy" size={24} color={COLORS.lighBlue} />
                        <Text style={styles.resourceText}>Marine Weather</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resourceItem}
                        onPress={() => Linking.openURL('tel:8669094911')}
                    >
                        <Icon source="lifebuoy" size={24} color={COLORS.lighBlue} />
                        <Text style={styles.resourceText}>Coast Guard</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Location Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={locationModalVisible}
                onRequestClose={() => { }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Icon source="map-marker-alert" size={32} color={COLORS.primary} />
                            <Text style={styles.modalTitle}>Location Required</Text>
                        </View>
                        <Text style={styles.modalText}>
                            Please enable location services to continue using Ocean Pulse.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={handleOpenSettings}>
                                <Text style={styles.modalButtonText}>Open Settings</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleExitApp} style={styles.exitButton}>
                                <Text style={styles.exitButtonText}>Exit App</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: COLORS.background,
    },
    headerText: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.lighBlue,
        letterSpacing: 1,
    },
    logoutButton: {
        padding: 8,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    greeting: {
        marginVertical: 20,
        alignItems: "center",
    },
    greetingText: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.lighBlue,
    },
    greetingSubtext: {
        fontSize: 16,
        color: COLORS.gray,
        marginTop: 4,
    },
    gridContainer: {
        marginTop: 10,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    btn: {
        width: '48%',
        borderRadius: 18,
        padding: 20,
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    btnContent: {
        alignItems: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.background,
        marginTop: 8,
        textAlign: 'center',
    },
    weatherBtn: {
        backgroundColor: '#0456C7',
    },
    sosBtn: {
        backgroundColor: '#9B1DFB',
    },
    routeBtn: {
        backgroundColor: '#04AAC7',
    },
    boatBtn: {
        backgroundColor: '#C7042E',
    },
    waveBtn: {
        backgroundColor: '#27B942',
    },
    communityBtn: {
        backgroundColor: '#FF8811',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 8,
        color: COLORS.primary,
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: COLORS.gray,
        lineHeight: 22,
    },
    modalButtons: {
        width: '100%',
    },
    modalButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    exitButton: {
        marginTop: 12,
        padding: 12,
        alignItems: 'center',
    },
    exitButtonText: {
        color: 'red',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    footerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.lighBlue,
        marginBottom: 12,
        textAlign: 'center',
    },
    resourceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    resourceItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
    },
    resourceText: {
        marginLeft: 8,
        fontSize: 16,
        color: COLORS.lighBlue,
    },
});