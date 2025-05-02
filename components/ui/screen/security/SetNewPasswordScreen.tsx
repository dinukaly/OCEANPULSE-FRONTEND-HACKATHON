import { COLORS } from "@/constants/ColorPallet";
import api from "@/utils/api";
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Icon, TextInput } from "react-native-paper";
import {
    validatePassword,
    validateConfirmPassword,
    validateFields,
} from "@/utils/validation";
export default function SetNewPasswordScreen({ route, navigation }: any) {
    const { email, resetToken } = route.params;
    const [password, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');



    const handleResetPassword = async () => {
        const passwordValidation = validatePassword(password);
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);

        const overallValidation = validateFields([passwordValidation, confirmPasswordValidation]);

        if (!overallValidation.isValid) {
            Alert.alert('Error', overallValidation.error);
            return;
        }

        try {
            const response = await api.post('/users/reset-password', {
                email,
                password,
                resetToken,
            });
            Alert.alert('Success', response.data.message);
            navigation.navigate('Login');
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || err.message || 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconWrapper}>
                <Icon size={30} source="lock-reset" color="#706D6D#706D6D" />
            </View>

            <Text style={styles.header}>Set New Password</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.gray, alignSelf: "center", marginTop: -10 }}>
                Password must contain at least 8 characters</Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1D3557", alignSelf: 'flex-start', marginLeft: 45, marginTop: 20 }}>Password</Text>
            <TextInput
                mode="flat"
                secureTextEntry={true}
                value={password}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                style={styles.input}
            />
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1D3557", alignSelf: 'flex-start', marginLeft: 45, marginTop: 20 }}>Confirm Password</Text>
            <TextInput
                mode="flat"
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Retype new password"
                style={styles.input}
            />
            <TouchableOpacity style={styles.continueButton} onPress={handleResetPassword}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 25 }} onPress={() => { }}>
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
    input: {
        height: 50,
        width: '80%',
        backgroundColor: '',
        marginBottom: 20,
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
