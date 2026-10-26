import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { COLORS } from '@/constants/ColorPallet';

interface CreatePostModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (content: string) => Promise<boolean>;
}

export default function CreatePostModal({
    visible,
    onDismiss,
    onSubmit,
}: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const busy = useRef(false);

    const dismiss = () => {
        if (!busy.current) onDismiss();
    };

    const handleSubmit = async () => {
        const text = content.trim();
        if (!text || text.length > 4000 || busy.current) return;
        busy.current = true;
        setIsSubmitting(true);
        setError(null);
        try {
            const saved = await onSubmit(text);
            if (saved) setContent('');
            else
                setError(
                    'Post was not confirmed. Your text has been kept. Check the feed before retrying; it may have been saved.',
                );
        } catch {
            setError(
                'Post was not confirmed. Your text has been kept. Check the feed before retrying; it may have been saved.',
            );
        } finally {
            busy.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={dismiss}
            transparent
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={dismiss}
                            disabled={isSubmitting}
                            accessibilityLabel="Close post editor"
                        />
                    </View>
                    <TextInput
                        mode="outlined"
                        value={content}
                        onChangeText={setContent}
                        placeholder="What's on your mind?"
                        multiline
                        numberOfLines={4}
                        maxLength={4000}
                        disabled={isSubmitting}
                        style={styles.input}
                    />
                    <Text>Text posts only. Image uploads are unavailable.</Text>
                    {error && (
                        <Text accessibilityLiveRegion="polite">{error}</Text>
                    )}
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={!content.trim() || isSubmitting}
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
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    postButton: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: COLORS.primary,
    },
});
