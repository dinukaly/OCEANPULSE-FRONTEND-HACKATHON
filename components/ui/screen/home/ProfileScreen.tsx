import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Alert,
    Modal,
    SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import type { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { clearSession } from '@/utils/session';
import useProfile from '@/utils/useProfile';

// Function to generate avatar initials
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Function to generate a random pastel color based on name
const getAvatarColor = (name: string) => {
    const colors = [
        '#FFD1DC',
        '#FFABAB',
        '#FFC3A0',
        '#FF677D',
        '#D4A5A5',
        '#392F5A',
        '#31A2AC',
        '#61C0BF',
        '#6B4226',
        '#8675A9',
        '#EFCFE3',
        '#B2E061',
    ];

    // Simple hash function
    const hash = name
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const ProfileScreen: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const profile = useProfile(userId, useIsFocused());
    const { user, loading } = profile;
    const avatarColor = user
        ? getAvatarColor(user.firstName + user.lastName)
        : '#61C0BF';
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            await clearSession();
            dispatch(logout());
        } catch {
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    if (loading && !user) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0080ff" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>
                    {profile.error || 'Could not load user profile.'}
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={profile.reload}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {profile.notice && (
                    <Text accessibilityLiveRegion="polite">
                        {profile.notice}
                    </Text>
                )}
                {profile.error && !profile.editing && (
                    <View>
                        <Text style={styles.errorText}>{profile.error}</Text>
                        <TouchableOpacity
                            onPress={profile.reload}
                            disabled={loading}
                            accessibilityRole="button"
                        >
                            <Text>Reload saved profile</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {loading && (
                    <ActivityIndicator accessibilityLabel="Refreshing saved profile" />
                )}
                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    <View style={styles.coverImage} />
                </View>

                {/* Profile Info Section */}
                <View style={styles.profileSection}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View
                            style={[
                                styles.avatar,
                                { backgroundColor: avatarColor },
                            ]}
                        >
                            <Text style={styles.avatarText}>
                                {getInitials(user.firstName, user.lastName)}
                            </Text>
                        </View>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.name}>
                            {user.firstName} {user.lastName}
                        </Text>
                        <Text style={styles.username}>@{user.username}</Text>
                        <View style={styles.statusBadge}>
                            <View
                                style={[
                                    styles.statusIndicator,
                                    {
                                        backgroundColor: user.isActive
                                            ? '#4CAF50'
                                            : '#F44336',
                                    },
                                ]}
                            />
                            <Text style={styles.statusText}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={profile.openEditor}
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
                            <Ionicons
                                name="call-outline"
                                size={20}
                                color="#555"
                            />
                            <Text style={styles.detailText}>
                                {user.contact}
                            </Text>
                        </View>
                    )}

                    {user.boatId && (
                        <View style={styles.detailItem}>
                            <Ionicons
                                name="boat-outline"
                                size={20}
                                color="#555"
                            />
                            <Text style={styles.detailText}>
                                Boat ID: {user.boatId}
                            </Text>
                        </View>
                    )}

                    {user.language && (
                        <View style={styles.detailItem}>
                            <Ionicons
                                name="language-outline"
                                size={20}
                                color="#555"
                            />
                            <Text style={styles.detailText}>
                                {user.language}
                            </Text>
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
                visible={profile.editing}
                onRequestClose={profile.closeEditor}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity
                                onPress={profile.closeEditor}
                                disabled={profile.saving}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {profile.error && (
                            <View>
                                <Text
                                    style={styles.errorText}
                                    accessibilityLiveRegion="polite"
                                >
                                    {profile.error}
                                </Text>
                                <TouchableOpacity
                                    onPress={profile.discardAndReload}
                                    disabled={profile.saving}
                                    accessibilityRole="button"
                                >
                                    <Text>
                                        Discard edits and reload saved profile
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={profile.draft.firstName}
                                maxLength={100}
                                editable={!profile.saving}
                                onChangeText={(text) =>
                                    profile.change('firstName', text)
                                }
                                placeholder="First Name"
                            />

                            <Text style={styles.inputLabel}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={profile.draft.lastName}
                                maxLength={100}
                                editable={!profile.saving}
                                onChangeText={(text) =>
                                    profile.change('lastName', text)
                                }
                                placeholder="Last Name"
                            />

                            <Text style={styles.inputLabel}>
                                Username (cannot be changed)
                            </Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={user.username}
                                editable={false}
                                placeholder="Username"
                            />

                            <Text style={styles.inputLabel}>
                                Email (cannot be changed here)
                            </Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={user.email}
                                editable={false}
                                placeholder="Email"
                                keyboardType="email-address"
                            />

                            <Text style={styles.inputLabel}>Contact</Text>
                            <TextInput
                                style={styles.input}
                                value={profile.draft.contact}
                                maxLength={100}
                                editable={!profile.saving}
                                onChangeText={(text) =>
                                    profile.change('contact', text)
                                }
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.inputLabel}>
                                Language (Sinhala or Tamil)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={profile.draft.language}
                                maxLength={100}
                                editable={!profile.saving}
                                onChangeText={(text) =>
                                    profile.change('language', text)
                                }
                                placeholder="Preferred Language"
                            />
                            <Text style={styles.inputLabel}>
                                Boat ID (optional)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={profile.draft.boatId}
                                maxLength={100}
                                editable={!profile.saving}
                                onChangeText={(text) =>
                                    profile.change('boatId', text)
                                }
                                placeholder="Boat ID"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={profile.closeEditor}
                                disabled={profile.saving}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={profile.save}
                                disabled={profile.saving}
                            >
                                <Text style={styles.saveButtonText}>
                                    {profile.saving
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </Text>
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
        backgroundColor: '#f8f8f8',
    },
    container: {
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    coverContainer: {
        height: 120,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        flex: 1,
        backgroundColor: '#355C7D',
        width: '100%',
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
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 15,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    username: {
        fontSize: 16,
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 8,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#555',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#355C7D',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        justifyContent: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
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
        marginBottom: 15,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 16,
        color: '#444',
        marginLeft: 10,
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
        marginTop: 0,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 16,
        maxHeight: 400,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    cancelButton: {
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#0080ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
});
