import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { FAB } from 'react-native-paper';
import axios from 'axios';
import getBaseUrl from '@/constants/BASEURL';
import PostCard from './components/PostCard';
import CreatePostModal from './components/CreatePostModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/ColorPallet';
import api from '@/utils/api';

export interface Comment {
    id: string;
    userId: string;
    username: string;
    content: string;
    createdAt: string; 
}

export interface Post {
    id: string;
    userId: string;
    username: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: Comment[];
    createdAt: string; 
}


export default function Communication() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [createPostVisible, setCreatePostVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        try {
            const response = await api.get('communityAlerts/posts');
            // Check if response has data property
            if (response.data && response.data.data) {
                setPosts(response.data.data);
                setError(null);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err: any) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const handleCreatePost = async (content: string, imageUri?: string) => {
        try {
            setLoading(true);
            
            const userId = await AsyncStorage.getItem('userId');
            const username = await AsyncStorage.getItem('username');
            
            if (!userId || !username) {
                throw new Error('Missing user data. Please log in again.');
            }

            const payload = {
                content,
                userId,
                username,
                imageUrl: imageUri || '',
            };

            const response = await api.post('communityAlerts/posts', payload);
            
            if (response.data && response.data.data) {
                const newPost: Post = {
                    ...response.data.data,
                    comments: response.data.data.comments || [],
                    likes: response.data.data.likes || 0,
                    userId: response.data.data.userId || userId,
                    username: response.data.data.username || username,
                };
                
                setPosts(prevPosts => [newPost, ...prevPosts]);
                setCreatePostVisible(false);
                setError(null);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(`Failed to create post: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleLike = async (postId: string) => {
        try {
            const response = await api.post(`communityAlerts/posts/${postId}/like`);
            if (response.data && response.data.data) {
                setPosts(prevPosts =>
                    prevPosts.map(post =>
                        post.id === postId ? { ...post, likes: response.data.data.likes } : post
                    )
                );
            }
        } catch (err: any) {
            console.error('Error liking post:', err);
            setError('Failed to like post. Please try again.');
        }
    };

    const handleComment = async (postId: string, content: string) => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const username = await AsyncStorage.getItem('username');

            if (!userId || !username) {
                throw new Error('User data missing. Please log in again.');
            }

            const response = await api.post(
                `communityAlerts/posts/${postId}/comment`,
                { content, userId, username }
            );

            if (response.data && response.data.data) {
                const newComment: Comment = response.data.data;
                setPosts(prevPosts =>
                    prevPosts.map(post =>
                        post.id === postId
                            ? { ...post, comments: [...post.comments, newComment] }
                            : post
                    )
                );
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err: any) {
            console.error('Error adding comment:', err);
            setError('Failed to add comment. Please try again.');
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onLike={handleLike}
                        onComment={handleComment}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                    />
                }
                contentContainerStyle={styles.listContainer}
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setCreatePostVisible(true)}
                color="#fff"
            />

            <CreatePostModal
                visible={createPostVisible}
                onDismiss={() => setCreatePostVisible(false)}
                onSubmit={handleCreatePost}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        padding: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.primary,
    },
});
