import { logFailure } from '@/utils/logging';
import { COLORS } from '@/constants/ColorPallet';
import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';
import { clearSession } from '@/utils/session';

export default function HomePageScreen({ navigation }: any) {
    const [username, setUsername] = useState('');

    useEffect(() => {
        const loadUsername = async () => {
            const storedUsername = await AsyncStorage.getItem('username');
            setUsername(storedUsername || 'User');
        };
        loadUsername();
    }, []);

    const dispatch = useDispatch();
    const handleLogout = async () => {
        try {
            await clearSession();
            dispatch(logout());
            // No need to navigate
        } catch (error) {
            logFailure('session.logout', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>OCEAN PULSE</Text>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    accessibilityRole="button"
                    accessibilityLabel="Log out"
                >
                    <Icon source="logout" size={24} color={COLORS.lighBlue} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>Hello {username}!</Text>
                    <Text style={styles.greetingSubtext}>
                        Fish smart, Navigate safe
                    </Text>
                </View>

                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Weather')}
                            accessibilityRole="button"
                            accessibilityLabel="Open weather"
                            style={[styles.btn, styles.weatherBtn]}
                        >
                            <View style={styles.btnContent}>
                                <Icon
                                    size={40}
                                    source="umbrella"
                                    color={COLORS.background}
                                />
                                <Text style={styles.btnText}>Live Weather</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.sosBtn]}
                            onPress={() => navigation.navigate('SOSSCREEN')}
                            accessibilityRole="button"
                            accessibilityLabel="Open SOS request"
                            accessibilityHint="OceanPulse records requests but does not dispatch rescue"
                        >
                            <View style={styles.btnContent}>
                                <Icon
                                    size={40}
                                    source="satellite-uplink"
                                    color={COLORS.background}
                                />
                                <Text style={styles.btnText}>SOS Request</Text>
                                <Text style={styles.sosNote}>
                                    No rescue dispatch
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gridRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Route')}
                            accessibilityRole="button"
                            accessibilityLabel="Open route map"
                            style={[styles.btn, styles.routeBtn]}
                        >
                            <View style={styles.btnContent}>
                                <Icon
                                    size={40}
                                    source="routes"
                                    color={COLORS.background}
                                />
                                <Text style={styles.btnText}>My Route</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate('UserListScreen')
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Open boat to boat chat"
                            style={[styles.btn, styles.boatBtn]}
                        >
                            <View style={styles.btnContent}>
                                <Icon
                                    size={40}
                                    source="sail-boat"
                                    color={COLORS.background}
                                />
                                <Text style={styles.btnText}>Boat to Boat</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gridRow}>
                        <View style={[styles.btn, styles.waveBtn]}>
                            <View style={styles.btnContent}>
                                <Icon
                                    size={40}
                                    source="waves"
                                    color={COLORS.background}
                                />
                                <Text style={styles.btnText}>
                                    Sea Conditions
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.btn, styles.communityBtn]}>
                            <View style={styles.btnContent}>
                                <Icon
                                    size={40}
                                    source="account-group"
                                    color={COLORS.background}
                                />
                                <Text style={styles.btnText}>Community</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
        fontWeight: 'bold',
        color: COLORS.lighBlue,
        letterSpacing: 1,
    },
    logoutButton: {
        padding: 8,
        minWidth: 48,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    greeting: {
        marginVertical: 20,
        alignItems: 'center',
    },
    greetingText: {
        fontSize: 22,
        fontWeight: 'bold',
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
        shadowColor: '#000',
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
        fontWeight: '600',
        color: COLORS.background,
        marginTop: 8,
        textAlign: 'center',
    },
    sosNote: {
        color: COLORS.background,
        fontSize: 12,
        marginTop: 4,
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
});
