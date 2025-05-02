import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ActivityIndicator, ScrollView, TextInput, Alert,
    Modal, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/(tabs)/navigation/stack-navigation/AppStackParamList';
import api from '@/utils/api';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
    _id?: string;
    userId?: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    isActive: boolean;
    contact?: string;
    language?: string;
    boatId?: string;
    avatar?: {
        resourceUrl: string;
    };
}

interface ApiResponse {
    data: {
        user: User;
    };
    success: boolean;
}

// Function to generate avatar initials
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Function to generate a random pastel color based on name
const getAvatarColor = (name: string) => {
    const colors = [
        '#FFD1DC', '#FFABAB', '#FFC3A0', '#FF677D', 
        '#D4A5A5', '#392F5A', '#31A2AC', '#61C0BF',
        '#6B4226', '#8675A9', '#EFCFE3', '#B2E061'
    ];
    
    // Simple hash function
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [avatarColor, setAvatarColor] = useState('#61C0BF');
    const dispatch = useDispatch();

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                });
            }
        };
        checkToken();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('Token not found');
                return;
            }

            const res = await api.get<ApiResponse>('users/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const userData = res.data.data.user;
            
            console.log('Fetched user data:', userData); // Add logging for debugging
            
            setUser(userData);
            
            // Initialize formData with ALL user fields, ensuring they're properly typed
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                username: userData.username || '',
                email: userData.email || '',
                contact: userData.contact || '',
                language: userData.language || '',
                boatId: userData.boatId || ''
            });
            
            // Set avatar color based on user name
            if (userData.firstName && userData.lastName) {
                setAvatarColor(getAvatarColor(userData.firstName + userData.lastName));
            }
        } catch (error) {
            console.error('Error fetching profile:', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            console.log('Submitting form data:', formData); // Add logging to confirm what's being sent

            const res = await api.put<ApiResponse>(
                'users/update-profile',
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUser(res.data.data.user);
            
            // Update formData with the returned user data to keep them in sync
            setFormData({
                firstName: res.data.data.user.firstName || '',
                lastName: res.data.data.user.lastName || '',  
                username: res.data.data.user.username || '',
                email: res.data.data.user.email || '',
                contact: res.data.data.user.contact || '',
                language: res.data.data.user.language || '',
                boatId: res.data.data.user.boatId || ''
            });
            
            setModalVisible(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error instanceof Error ? error.message : 'Unknown error');
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user', 'userId', 'username']);
            dispatch(logout());
            // No need to navigate - the App component will handle navigation based on auth state
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (field: keyof User, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // When modal is opened, ensure formData is synced with current user data
    const handleOpenModal = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
                contact: user.contact || '',
                language: user.language || '',
                boatId: user.boatId || ''
            });
        }
        setModalVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0080ff" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Could not load user profile.</Text>
                <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={fetchProfile}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    <View style={styles.coverImage} />
                </View>
                
                {/* Profile Info Section */}
                <View style={styles.profileSection}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {user.avatar?.resourceUrl ? (
                            <Image
                                source={{ uri: user.avatar.resourceUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                                <Text style={styles.avatarText}>
                                    {getInitials(user.firstName, user.lastName)}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                        <Text style={styles.username}>@{user.username}</Text>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusIndicator, { backgroundColor: user.isActive ? '#4CAF50' : '#F44336' }]} />
                            <Text style={styles.statusText}>{user.isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                    </View>
                    
                    {/* Edit Button */}
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={handleOpenModal}
                    >
                        <Ionicons name="pencil" size={16} color="#fff" />
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Profile Details Section */}
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    
                    <View style={styles.detailItem}>
                        <Ionicons name="mail-outline" size={20} color="#555" />
                        <Text style={styles.detailText}>{user.email}</Text>
                    </View>
                    
                    {user.contact && (
                        <View style={styles.detailItem}>
                            <Ionicons name="call-outline" size={20} color="#555" />
                            <Text style={styles.detailText}>{user.contact}</Text>
                        </View>
                    )}
                    
                    {user.language && (
                        <View style={styles.detailItem}>
                            <Ionicons name="language-outline" size={20} color="#555" />
                            <Text style={styles.detailText}>{user.language}</Text>
                        </View>
                    )}
                </View>
                
                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
            
            {/* Edit Profile Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.firstName}
                                onChangeText={text => handleChange('firstName', text)}
                                placeholder="First Name"
                            />
                            
                            <Text style={styles.inputLabel}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.lastName}
                                onChangeText={text => handleChange('lastName', text)}
                                placeholder="Last Name"
                            />
                            
                            <Text style={styles.inputLabel}>Username (cannot be changed)</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={formData.username}
                                editable={false}
                                placeholder="Username"
                            />
                            
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={text => handleChange('email', text)}
                                placeholder="Email"
                                keyboardType="email-address"
                            />
                            
                            <Text style={styles.inputLabel}>Contact (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contact}
                                onChangeText={text => handleChange('contact', text)}
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                            />
                            
                            <Text style={styles.inputLabel}>Language (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.language}
                                onChangeText={text => handleChange('language', text)}
                                placeholder="Preferred Language"
                            />
                        </ScrollView>
                        
                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f8f8'
    },
    container: {
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    coverContainer: {
        height: 120,
        width: '100%',
        position: 'relative'
    },
    coverImage: {
        flex: 1,
        backgroundColor: '#355C7D',
        width: '100%'
    },
    profileSection: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginTop: -50,
        marginHorizontal: 16,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
    },
    avatarContainer: {
        marginTop: -40,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff'
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 15
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333'
    },
    username: {
        fontSize: 16,
        color: '#666',
        marginTop: 2
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 8
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6
    },
    statusText: {
        fontSize: 14,
        color: '#555'
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#355C7D',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        justifyContent: 'center'
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6
    },
    detailsSection: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    detailText: {
        fontSize: 16,
        color: '#444',
        marginLeft: 10
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#E74C3C',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 16,
        marginTop: 0
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 16
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    closeButton: {
        padding: 4
    },
    modalBody: {
        padding: 16,
        maxHeight: 400
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 16
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 6
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    disabledInput: {
        backgroundColor: '#e9e9e9',
        color: '#888',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500'
    },
    cancelButton: {
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#0080ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '500'
    }
});