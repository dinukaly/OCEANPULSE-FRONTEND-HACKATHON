import { COLORS } from "@/constants/ColorPallet";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Icon, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from 'react-redux';
import { setUserId } from '@/store/authSlice';
import api from '@/utils/api';
import { validateEmail, validatePassword, validateFields } from '@/utils/validation';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialChecking, setInitialChecking] = useState(true);
    const [errors, setErrors] = useState({ email: '', password: '' });
    const dispatch = useDispatch();

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userId = await AsyncStorage.getItem('userId');
                
                if (token && userId) {
                    console.log('Token found, navigating to Process screen');
                    dispatch(setUserId(userId)); // This will now set isAuthenticated to true
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Process' }],
                    });
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
            } finally {
                setInitialChecking(false);
            }
        };
        
        checkToken();
    }, [dispatch, navigation]);

    const validateInputs = () => {
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);

        setErrors({
            email: emailValidation.error,
            password: passwordValidation.error
        });

        const validation = validateFields([emailValidation, passwordValidation]);
        return validation.isValid;
    };

    const handleLogin = async () => {
        if (!validateInputs()) return;
        
        try {
            setLoading(true);
            const response = await api.post('users/login', { email, password });
            console.log('Login response:', response.data);

            const { data } = response.data;

            if (!data || !data.user || !data.token) {
                throw new Error('Invalid response structure from server');
            }

            const { user, token } = data;

            if (!user.isActive) {
                navigation.navigate('VerifyOtp', { 
                    username: user.username, 
                    email: user.email 
                });
                await AsyncStorage.setItem('tempToken', token);
            } else {
                await AsyncStorage.multiSet([
                    ['token', token],
                    ['userId', user.userId.toString()],
                    ['username', user.username],
                    ['user', JSON.stringify(user)]
                ]);

                dispatch(setUserId(user.userId.toString())); // This will now set isAuthenticated to true

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Process' }],
                });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Alert.alert('Login Error', errorMessage);
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

   
    if (initialChecking) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text>Checking login status...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerPanel}>
                <Text style={styles.headerPanelText}>Fish smart</Text>
                <Text style={styles.headerPanelText}>Navigate right....</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.headerElement}>
                {[
                    { icon: "weather-lightning-rainy", label: "Weather" },
                    { icon: "phone-alert-outline", label: "Emergency" },
                    { icon: "shield-alert-outline", label: "Safety Tips" },
                ].map((item, index) => (
                    <View key={index} style={styles.headerElements}>
                        <Icon size={50} source={item.icon} color="#0456C7" />
                        <Text style={styles.headerElementLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.formcontainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    mode="flat"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                            setErrors(prev => ({ ...prev, email: '' }));
                        }
                    }}
                    placeholder="Enter Email"
                    style={[styles.input, errors.email ? styles.inputError : null]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                <Text style={styles.label}>Password</Text>
                <TextInput
                    mode="flat"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                            setErrors(prev => ({ ...prev, password: '' }));
                        }
                    }}
                    placeholder="Enter your password"
                    style={[styles.input, errors.password ? styles.inputError : null]}
                    secureTextEntry
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
                    <Text style={styles.signInButtonText}>Sign in</Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>
                        Don't have an account?
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupLink}> Sign up</Text>
                        </TouchableOpacity>
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#fff",
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerPanel: {
        width: "100%",
        height: 200,
        backgroundColor: "#0456C7",
        paddingTop: 50,
    },
    headerPanelText: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#fff",
        paddingLeft: 20,
    },
    line: {
        height: 1,
        backgroundColor: "#ccc",
        width: "90%",
        alignSelf: "center",
        marginVertical: 20,
    },
    headerElement: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: -30,
    },
    headerElements: {
        backgroundColor: "#fff",
        borderRadius: 10,
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 8,
    },
    headerElementLabel: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "bold",
        color: "#0456C7",
        textAlign: "center",
    },
    formcontainer: {
        padding: 20,
        width: '95%',
        marginTop: 20,
    },
    label: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1D3557",
    },
    input: {
        backgroundColor: '',
        marginBottom: 20,
    },
    inputError: {
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    errorText: {
        color: COLORS.primary,
        fontSize: 12,
        marginTop: -15,
        marginBottom: 15,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0456C7",
        alignSelf: "flex-end",
        marginTop: -10,
    },
    signInButton: {
        backgroundColor: "#0456C7",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 20,
    },
    signInButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    signupContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    signupText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray,
    },
    signupLink: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0456C7",
    },
});
