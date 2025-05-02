import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Card, IconButton, Avatar } from 'react-native-paper';
import { COLORS } from '@/constants/ColorPallet';

import type { Post, Comment } from '../Communication';

interface PostCardProps {
    post: Post;
    onLike: (postId: string) => void;
    onComment: (postId: string, content: string) => void;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    const handleSubmitComment = () => {
        if (commentText.trim()) {
            onComment(post.id, commentText.trim());
            setCommentText('');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card style={styles.card}>
            <Card.Title
                title={post.username}
                subtitle={formatDate(post.createdAt)}
                left={(props) => (
                    <Avatar.Text
                        {...props}
                        label={(post.username?.[0] || '?').toUpperCase()}
                        style={{ backgroundColor: COLORS.primary }}
                    />
                )}
            />

            <Card.Content>
                <Text style={styles.content}>{post.content}</Text>
                {post.imageUrl && (
                    <Image
                        source={{ uri: post.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.interactions}>
                    <TouchableOpacity
                        style={styles.interactionButton}
                        onPress={() => onLike(post.id)}
                    >
                        <IconButton
                            icon="heart"
                            size={20}
                            iconColor={COLORS.primary}
                        />
                        <Text>{post.likes} Likes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.interactionButton}
                        onPress={() => setShowComments(!showComments)}
                    >
                        <IconButton
                            icon="comment"
                            size={20}
                            iconColor={COLORS.primary}
                        />
                        <Text>{post.comments.length} Comments</Text>
                    </TouchableOpacity>
                </View>

                {showComments && (
                    <View style={styles.commentsSection}>
                        {post.comments.map((comment) => (
                            <View key={comment.id} style={styles.comment}>
                                <Text style={styles.commentUsername}>
                                    {comment.username}
                                </Text>
                                <Text>{comment.content}</Text>
                            </View>
                        ))}

                        <View style={styles.addCommentSection}>
                            <TextInput
                                style={styles.commentInput}
                                value={commentText}
                                onChangeText={setCommentText}
                                placeholder="Add a comment..."
                                multiline
                            />
                            <IconButton
                                icon="send"
                                size={24}
                                iconColor={COLORS.primary}
                                onPress={handleSubmitComment}
                                disabled={!commentText.trim()}
                            />
                        </View>
                    </View>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        elevation: 4,
    },
    content: {
        fontSize: 16,
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    interactions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentsSection: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    comment: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    commentUsername: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    addCommentSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
    },
});