import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Platform,
} from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/ColorPallet';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CreatePostModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (content: string, imageUri?: string) => void;
}

export default function CreatePostModal({
    visible,
    onDismiss,
    onSubmit,
}: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (content.trim() && !isSubmitting) {
            setIsSubmitting(true);
            try {
                // Verify user data exists before submitting
                const userId = await AsyncStorage.getItem('userId');
                const username = await AsyncStorage.getItem('username');
                
                if (!userId || !username) {
                    alert('User data missing. Please log in again.');
                    return;
                }
                
                await onSubmit(content.trim(), imageUri);
                setContent('');
                setImageUri(undefined);
            } catch (error) {
                console.error('Error submitting post:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onDismiss}
            transparent
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={onDismiss}
                        />
                    </View>

                    <TextInput
                        mode="outlined"
                        value={content}
                        onChangeText={setContent}
                        placeholder="What's on your mind?"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                    />

                    {imageUri && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.previewImage}
                            />
                            <IconButton
                                icon="close"
                                size={20}
                                style={styles.removeImage}
                                onPress={() => setImageUri(undefined)}
                            />
                        </View>
                    )}

                    <View style={styles.actions}>
                        <Button
                            icon="camera"
                            mode="outlined"
                            onPress={handlePickImage}
                            style={styles.imageButton}
                        >
                            Add Image
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            disabled={!content.trim()}
                            style={styles.postButton}
                        >
                            Post
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    input: {
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    removeImage: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#fff',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    imageButton: {
        flex: 1,
        marginRight: 8,
    },
    postButton: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: COLORS.primary,
    },
});