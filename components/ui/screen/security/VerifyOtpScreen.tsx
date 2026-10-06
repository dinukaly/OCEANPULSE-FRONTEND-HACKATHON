import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { COLORS } from "@/constants/ColorPallet";
import api from '@/utils/api';
import { useDispatch } from 'react-redux';
import { setUserId } from '@/store/authSlice';
import { Icon } from "react-native-paper";
import { saveSession } from '@/utils/session';

export default function VerifyOtpScreen({ navigation, route }: any) {
    const { username, email } = route.params;
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputs = useRef<(TextInput | null)[]>([]);
    const dispatch = useDispatch();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0 && !canResend) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        } else if (countdown === 0 && !canResend) {
            setCanResend(true);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown, canResend]);

    const handleChange = (text: string, index: number) => {
        // Only accept digits
        if (!/^\d*$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus to next input field
        if (text && index < inputs.current.length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace for empty fields to go back
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setLoading(true);
            const otpString = otp.join('');

            if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
                Alert.alert('Error', 'Please enter a valid 6-digit code');
                return;
            }

            const response = await api.post('users/verify-otp', {
                username,
                otp: otpString
            });

            if (response.data.success) {
                const { token, user } = response.data.data;

                // Save the active token and user information
                await saveSession(token, user);

                // Update Redux state
                dispatch(setUserId(user.userId.toString()));

                Alert.alert('Success', 'Account verified successfully');
            } else {
                throw new Error('Verification failed');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Invalid OTP code';
            Alert.alert('Verification Error', errorMessage);
            console.error('OTP verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setResendLoading(true);

            const response = await api.post('users/resend-verification-otp', { username, email });

            if (response.data.success) {
                // Reset the OTP fields
                setOtp(["", "", "", "", "", ""]);

                // Reset countdown
                setCountdown(60);
                setCanResend(false);

                Alert.alert('Success', 'New OTP has been sent to your email');
            } else {
                throw new Error('Failed to resend OTP');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
            Alert.alert('Error', errorMessage);
            console.error('Resend OTP error:', error);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconWrapper}>
                <Icon size={30} source="email-newsletter" color="#706D6D" />
            </View>

            <Text style={styles.header}>Verify OTP Code</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.gray, alignSelf: "center", marginTop: -10 }}>
                We sent a code to {email}
            </Text>

            <Text style={styles.label}>Enter Code</Text>

            <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                        key={index}
                        style={styles.otpInput}
                        value={otp[index]}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        maxLength={1}
                        keyboardType="number-pad"
                        ref={(input) => {
                            inputs.current[index] = input;
                        }}
                    />
                ))}
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleVerifyOtp} disabled={loading} accessibilityRole="button">
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>{loading ? 'Verifying...' : 'Continue'}</Text>
            </TouchableOpacity>

            {resendLoading ? <ActivityIndicator color={COLORS.primary} /> : canResend ? (
                <TouchableOpacity onPress={handleResendOtp} accessibilityRole="button" style={{ marginTop: 16 }}>
                    <Text style={{ color: '#0456C7', fontWeight: 'bold' }}>Resend code</Text>
                </TouchableOpacity>
            ) : <Text style={{ marginTop: 16, color: COLORS.gray }}>Resend code in {countdown}s</Text>}

            <TouchableOpacity style={{ marginTop: 25 }} onPress={() => navigation.navigate('Login')}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon size={14} source="arrow-left" color="#706D6D" />
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#706D6D", marginLeft: 5 }}>
                        Back to Login
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#0456C7",
        marginBottom: 20,
    },
    label: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1D3557",
        alignSelf: 'flex-start',
        marginLeft: 45,
        marginTop: 20,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "90%",
        marginTop: 15,
        marginBottom: 20,
    },
    otpInput: {
        width: 42,
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        textAlign: "center",
        fontSize: 18,
    },
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
        borderColor: '#D9D9D9',
        borderWidth: 1,
        height: 50,
        width: 50,
        borderRadius: 10,
    },
    continueButton: {
        backgroundColor: "#0456C7",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 20,
        width: '80%',
    }
});
