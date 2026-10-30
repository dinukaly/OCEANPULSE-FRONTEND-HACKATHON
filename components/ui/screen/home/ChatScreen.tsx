import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import useMessages from "@/utils/useMessages";
import useMessagingActive from "@/utils/useMessagingActive";
import { Message, messageKey } from "@/utils/messaging";

type ChatScreenParams = { otherUserId: string; otherUserName?: string };

export default function ChatScreen({
  route,
}: {
  route: { params: ChatScreenParams };
}) {
  const { otherUserId, otherUserName } = route.params;
  const myId = useSelector((state: RootState) => state.auth.userId);
  const active = useMessagingActive();
  const chat = useMessages(myId, otherUserId, active);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);
  const scrollForNewMessages = useRef(true);
  const latestChat = useRef(chat);
  latestChat.current = chat;
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 500,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Message>[] }) => {
      void latestChat.current.markVisible(
        viewableItems
          .filter((item) => item.isViewable)
          .map((item) => item.item.id),
      );
    },
  ).current;
  const newestId = chat.messages[chat.messages.length - 1]?.id;
  useEffect(() => {
    scrollForNewMessages.current = true;
  }, [newestId]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.senderId === myId
          ? styles.myMessageContainer
          : styles.theirMessageContainer,
      ]}
    >
      <Text
        style={
          item.senderId === myId
            ? styles.myMessageText
            : styles.theirMessageText
        }
      >
        {item.message}
      </Text>
      {item.timestamp && (
        <Text
          style={[
            styles.timestamp,
            item.senderId === myId ? styles.myTimestamp : styles.theirTimestamp,
          ]}
        >
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
      {item.senderId === myId && (
        <Text style={styles.myTimestamp}>
          {item.localStatus === "sending"
            ? "Sending…"
            : item.localStatus === "failed"
              ? "Send not confirmed"
              : item.read
                ? "Read"
                : "Sent"}
        </Text>
      )}
      {item.localStatus === "failed" && (
        <View>
          <Button
            title="Retry message"
            onPress={() => {
              void chat.retry(item);
            }}
          />
          <Button
            title="Discard local copy"
            onPress={() => chat.discard(messageKey(item))}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{otherUserName || "Chat"}</Text>
      </View>
      <Text accessibilityLiveRegion="polite">
        {active ? chat.status : "Chat paused"}
      </Text>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        {chat.loading && chat.messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chat.messages}
            keyExtractor={messageKey}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            ListHeaderComponent={
              <View>
                {chat.error && (
                  <Text style={styles.errorText}>{chat.error}</Text>
                )}
                {chat.error && (
                  <Button title="Retry history" onPress={chat.refresh} />
                )}
                {chat.messages.some(
                  (message) => message.localStatus === "failed",
                ) && (
                  <Text>
                    Unconfirmed messages are kept while this chat is open.
                    Discarding a local copy does not cancel a message the server
                    may have saved.
                  </Text>
                )}
                {chat.hasMore && (
                  <Button
                    title={
                      chat.loadingMore ? "Loading..." : "Load older messages"
                    }
                    disabled={chat.loadingMore}
                    onPress={() => {
                      scrollForNewMessages.current = false;
                      void chat.loadMore();
                    }}
                  />
                )}
              </View>
            }
            ListEmptyComponent={<Text>No messages yet.</Text>}
            onContentSizeChange={() => {
              if (scrollForNewMessages.current)
                flatListRef.current?.scrollToEnd({ animated: false });
            }}
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            accessibilityLabel="Message"
            placeholderTextColor="#999"
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={styles.sendButton}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !input.trim() || chat.sending }}
            disabled={!input.trim() || chat.sending}
            onPress={() => {
              if (chat.send(input)) {
                scrollForNewMessages.current = true;
                setInput("");
              }
            }}
          >
            <Ionicons
              name="send"
              size={24}
              color={!input.trim() ? "#ccc" : "#5E8BFF"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 16, backgroundColor: "#5E8BFF", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  container: { flex: 1 },
  messagesList: { paddingHorizontal: 16, paddingBottom: 10 },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 10,
    maxWidth: "75%",
  },
  myMessageContainer: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  theirMessageContainer: {
    backgroundColor: "#E5E5EA",
    alignSelf: "flex-start",
  },
  myMessageText: { color: "#000" },
  theirMessageText: { color: "#000" },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  myTimestamp: {
    alignSelf: "flex-end",
    color: "#555",
  },
  theirTimestamp: {
    alignSelf: "flex-start",
    color: "#555",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { padding: 20, alignItems: "center" },
  errorText: { color: "red", marginBottom: 10 },
});
