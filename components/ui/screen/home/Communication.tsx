import { logFailure } from "@/utils/logging";
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { FAB } from "react-native-paper";
import PostCard from "./components/PostCard";
import CreatePostModal from "./components/CreatePostModal";
import { COLORS } from "@/constants/ColorPallet";
import api from "@/utils/api";
import usePagedList from "@/utils/usePagedList";

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
  const {
    items: posts,
    setItems: setPosts,
    loading: loadingPosts,
    loadingMore,
    error: listError,
    refresh: fetchPosts,
    loadMore,
    hasMore,
  } = usePagedList<Post>("communityAlerts/posts", "id");
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creating = useRef(false);

  const handleCreatePost = async (content: string): Promise<boolean> => {
    if (creating.current) return false;
    creating.current = true;
    try {
      const response = await api.post(
        "communityAlerts/posts",
        { content },
        { timeout: 15000 },
      );

      if (response.data?.success && response.data.data?.id) {
        const newPost: Post = {
          ...response.data.data,
          comments: response.data.data.comments || [],
          likes: response.data.data.likes || 0,
        };

        setPosts((prevPosts) => [newPost, ...prevPosts]);
        setCreatePostVisible(false);
        setError(null);
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      logFailure("post.create", err);
      setError(
        err.response?.data?.message ||
          "Post was not confirmed. Check the feed before retrying; the server may have saved it.",
      );
      return false;
    } finally {
      creating.current = false;
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await api.post(`communityAlerts/posts/${postId}/like`);
      if (response.data && response.data.data) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, likes: response.data.data.likes }
              : post,
          ),
        );
      }
    } catch (err: any) {
      logFailure("post.like", err);
      setError("Failed to like post. Please try again.");
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      const response = await api.post(
        `communityAlerts/posts/${postId}/comment`,
        { content },
        { timeout: 15000 },
      );

      if (response.data && response.data.data) {
        const newComment: Comment = response.data.data;
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newComment] }
              : post,
          ),
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      logFailure("post.comment", err);
      setError("Failed to add comment. Please try again.");
    }
  };

  if (loadingPosts && posts.length === 0 && !createPostVisible) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(error || listError) && (
        <Text style={styles.errorText}>{error || listError}</Text>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onLike={handleLike} onComment={handleComment} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loadingPosts}
            onRefresh={fetchPosts}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          hasMore ? (
            <Text
              accessibilityRole="button"
              onPress={() => {
                if (!loadingMore) void loadMore();
              }}
            >
              {loadingMore ? "Loading..." : "Load more posts"}
            </Text>
          ) : null
        }
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
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});
