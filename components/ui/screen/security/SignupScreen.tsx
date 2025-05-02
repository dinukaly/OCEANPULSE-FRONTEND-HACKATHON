import { COLORS } from '@/constants/ColorPallet';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';
import api from '@/utils/api';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from 'react-redux';
import { setUserId } from '@/store/authSlice';
import { validateName, validateEmail, validatePassword, validateConfirmPassword, validatePhone, validateBoatId, validateFields } from '@/utils/validation';

export default function SignupScreen({ navigation }: any) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [boatId, setBoatId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        password: '',
        confirmPassword: '',
        boatId: ''
    });
    
    const dispatch = useDispatch();

    const validateInputs = () => {
        const firstNameValidation = validateName(firstName, 'First Name');
        const lastNameValidation = validateName(lastName, 'Last Name');
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
        const phoneValidation = validatePhone(contact);
        const boatIdValidation = validateBoatId(boatId);

        setErrors({
            firstName: firstNameValidation.error,
            lastName: lastNameValidation.error,
            email: emailValidation.error,
            contact: phoneValidation.error,
            password: passwordValidation.error,
            confirmPassword: confirmPasswordValidation.error,
            boatId: boatIdValidation.error
        });

        return validateFields([
            firstNameValidation,
            lastNameValidation,
            emailValidation,
            passwordValidation,
            confirmPasswordValidation,
            phoneValidation,
            boatIdValidation
        ]).isValid;
    };

    const handleRegister = async () => {
        if (!validateInputs()) return;
        
        try {
            setLoading(true);
            
            const response = await api.post('users/register', {
                firstName,
                lastName,
                email,
                contact,
                password,
                boatId,
            });
            
            const { data } = response.data;
            
            if (data && data.user && data.token) {
                await AsyncStorage.setItem('tempToken', data.token);
                
                navigation.navigate('VerifyOtp', { 
                    username: data.user.username,
                    email: data.user.email
                });
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            Alert.alert('Registration Error', errorMessage);
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearError = (field: string) => {
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerPanel}>
                <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#fff' }}>Signup</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formcontainer}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        mode="flat"
                        value={firstName}
                        onChangeText={(text) => {
                            setFirstName(text);
                            clearError('firstName');
                        }}
                        placeholder="Enter First Name"
                        style={[styles.input, errors.firstName ? styles.inputError : null]}
                    />
                    {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        mode="flat"
                        value={lastName}
                        onChangeText={(text) => {
                            setLastName(text);
                            clearError('lastName');
                        }}
                        placeholder="Enter Last Name"
                        style={[styles.input, errors.lastName ? styles.inputError : null]}
                    />
                    {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        mode="flat"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            clearError('email');
                        }}
                        placeholder="Enter Email"
                        style={[styles.input, errors.email ? styles.inputError : null]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                    <Text style={styles.label}>Boat ID (Optional)</Text>
                    <TextInput
                        mode="flat"
                        value={boatId}
                        onChangeText={(text) => {
                            setBoatId(text);
                            clearError('boatId');
                        }}
                        placeholder="Enter Boat ID (e.g., B002)"
                        style={[styles.input, errors.boatId ? styles.inputError : null]}
                    />
                    {errors.boatId ? <Text style={styles.errorText}>{errors.boatId}</Text> : null}

                    <Text style={styles.label}>Contact (Optional)</Text>
                    <TextInput
                        mode="flat"
                        value={contact}
                        onChangeText={(text) => {
                            setContact(text);
                            clearError('contact');
                        }}
                        placeholder="+94 77 123 4567"
                        style={[styles.input, errors.contact ? styles.inputError : null]}
                        keyboardType="phone-pad"
                    />
                    {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : null}

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        mode="flat"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            clearError('password');
                        }}
                        placeholder="Enter your password"
                        style={[styles.input, errors.password ? styles.inputError : null]}
                        secureTextEntry={true}
                    />
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        mode="flat"
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            clearError('confirmPassword');
                        }}
                        placeholder="Re-enter your password"
                        style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                        secureTextEntry={true}
                    />
                    {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

                    <TouchableOpacity 
                        style={[styles.signInButton, loading && styles.disabledButton]} 
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginText}>
                            Already have an account?
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}> Sign in</Text>
                            </TouchableOpacity>
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerPanel: {
        width: '100%',
        height: 100,
        backgroundColor: '#0456C7',
        paddingTop: 50,
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    formcontainer: {
        padding: 20,
        width: '95%',
        alignSelf: 'center',
        marginTop: 20,
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
    signInButton: {
        backgroundColor: "#0456C7",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 20,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    label: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1D3557",
    },
    loginLinkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0456C7",
    },
});
