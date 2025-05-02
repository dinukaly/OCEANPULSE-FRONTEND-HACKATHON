import { COLORS } from "@/constants/ColorPallet";
import api from "@/utils/api";
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Icon, TextInput } from "react-native-paper";
import { ActivityIndicator } from 'react-native';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen({navigation}: any) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleForgotPassword = async () => {
        const validation = validateEmail(email);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/users/forgot-password', { email });
            console.log("Reset instructions sent:", response.data);
            alert("Reset instructions have been sent to your email.");
            navigation.navigate('ResetPasswordOtpVefication', {
                email
            });
        } catch (error) {
            console.error("Forgot password error:", error);
            alert("Failed to send reset instructions. Please check your email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconWrapper}>
                <Icon size={30} source="lock-outline" color="#706D6D" />
            </View>

            <Text style={styles.header}>Forgot Password</Text>
            <Text style={styles.subText}>
                No worries. We'll send you reset instructions
            </Text>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
                mode="flat"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setError("");
                }}
                placeholder="Enter your email"
                style={[styles.input, error ? styles.inputError : null]}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
                style={[styles.continueButton, loading && styles.disabledButton]} 
                onPress={handleForgotPassword}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Sending...' : 'Continue'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.navigate('Login')}
            >
                <View style={styles.backButtonContent}>
                    <Icon size={14} source="arrow-left" color="#706D6D" />
                    <Text style={styles.backButtonText}>
                        Back to Login
                    </Text>
                </View>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#0456C7" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    header: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#0456C7",
        marginBottom: 10,
    },
    subText: {
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
        alignSelf: 'flex-start',
        marginLeft: 25,
    },
    input: {
        height: 50,
        width: '90%',
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
        alignSelf: 'flex-start',
        marginLeft: 25,
    },
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
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
        width: '90%',
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    backButton: {
        marginTop: 25,
    },
    backButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#706D6D",
        marginLeft: 5,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
