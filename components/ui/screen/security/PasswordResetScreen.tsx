import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { COLORS } from "@/constants/ColorPallet";
import api from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon } from "react-native-paper";

export default function ForgotPasswordOtpScreen({ navigation, route }: any) {
    const { email, token } = route.params;
    const [otp, setOtp] = useState(["", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0 && !canResend) {
            timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0 && !canResend) {
            setCanResend(true);
        }
        return () => clearTimeout(timer);
    }, [countdown, canResend]);

    const handleChange = (text: string, index: number) => {
        if (!/^\d*$/.test(text)) return;
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < inputs.current.length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setLoading(true);
            const otpString = otp.join('');

            if (otpString.length !== 5 || !/^\d{5}$/.test(otpString)) {
                Alert.alert('Error', 'Please enter a valid 5-digit OTP');
                return;
            }

            const response = await api.post('users/verify-reset-otp', { email, otp: otpString, token });

            if (response.data.success) {
                await AsyncStorage.setItem('resetToken', response.data.data.resetToken);
                Alert.alert('Success', 'OTP verified successfully', [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('SetNewPassword', {
                            email,
                            resetToken: response.data.data.resetToken
                        }),
                    }
                ]);
            } else {
                throw new Error('Verification failed');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Invalid OTP code';
            Alert.alert('Verification Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setResendLoading(true);
            const response = await api.post('users/forgot-password', { email });

            if (response.data.success) {
                setOtp(["", "", "", "", ""]);
                setCountdown(60);
                setCanResend(false);
                Alert.alert('Success', 'New OTP has been sent to your email');
            } else {
                throw new Error('Failed to resend OTP');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
            Alert.alert('Error', errorMessage);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconWrapper}>
                <Icon size={30} source="email-newsletter" color="#706D6D" />
            </View>

            <Text style={styles.header}>Reset Password</Text>
            <Text style={styles.description}>We've sent a code to {email}</Text>

            <Text style={styles.label}>Enter Code</Text>

            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        maxLength={1}
                        keyboardType="number-pad"
                        ref={(input) => { inputs.current[index] = input; }}
                    />
                ))}
            </View>

            {loading ? (
                <View style={styles.continueButton}>
                    <ActivityIndicator color="#fff" />
                </View>
            ) : (
                <TouchableOpacity style={styles.continueButton} onPress={handleVerifyOtp}>
                    <Text style={styles.continueText}>Verify</Text>
                </TouchableOpacity>
            )}

            <View style={styles.resendContainer}>
                {resendLoading ? (
                    <ActivityIndicator color="#0456C7" size="small" />
                ) : canResend ? (
                    <TouchableOpacity onPress={handleResendOtp}>
                        <Text style={styles.resendText}>Resend OTP</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.countdownText}>Resend OTP in {countdown}s</Text>
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
                <View style={styles.backButtonContent}>
                    <Icon size={14} source="arrow-left" color="#706D6D" />
                    <Text style={styles.backButtonText}>Back to Login</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        alignItems: "center",
        backgroundColor: "#fff"
    },
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#D9D9D9",
        borderWidth: 1,
        height: 50,
        width: 50,
        borderRadius: 10,
        marginBottom: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#0456C7",
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray,
        marginBottom: 30,
        textAlign: "center",
    },
    label: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1D3557",
        alignSelf: "flex-start",
        marginBottom: 10,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
        marginBottom: 20,
    },
    otpInput: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        textAlign: "center",
        fontSize: 18,
        backgroundColor: "#f9f9f9",
    },
    continueButton: {
        backgroundColor: "#0456C7",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
        marginTop: 20,
    },
    continueText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    resendContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    resendText: {
        color: "#0456C7",
        fontWeight: "bold",
        fontSize: 16,
    },
    countdownText: {
        color: COLORS.gray,
        fontSize: 14,
    },
    backButton: {
        marginTop: 30,
    },
    backButtonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#706D6D",
        marginLeft: 5,
    },
});
