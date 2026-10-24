// Ensure each item has a unique key
const keyExtractor = (item: Message) => {
    return item.id || item._id || `${item.senderId}-${item.timestamp || Date.now()}`;
};import React, { useState, useEffect } from 'react';
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
Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import axiosInstance from '@/utils/api';
import usePagedList from '@/utils/usePagedList';
import { mergeItems } from '@/utils/contracts';


type Message = {
id: string;
_id?: string;  // Add this for MongoDB-style IDs
senderId: string;
receiverId: string;
message: string;
timestamp?: string | null;
};

type ChatScreenParams = {
otherUserId: string;
otherUserName?: string;
};

export default function ChatScreen({ route }: { route: { params: ChatScreenParams } }) {
const { otherUserId, otherUserName } = route.params;
const myId = useSelector((state: RootState) => state.auth.userId);

const path = `messages/get?user1=${encodeURIComponent(myId || '')}&user2=${encodeURIComponent(otherUserId)}`;
const { items: messages, setItems: setMessages, loading: isLoading, error: fetchError,
    refresh: retryMessages, refreshLatest: fetchMessages, loadMore, hasMore, loadingMore } =
    usePagedList<Message>(path, 'id', Boolean(myId && otherUserId));
const [input, setInput] = useState('');
const [error, setError] = useState<string | null>(null);
const [sending, setSending] = useState(false);
const flatListRef = React.useRef<FlatList>(null);
const scrollForNewMessages = React.useRef(true);

useEffect(() => {
    const interval = setInterval(() => { void fetchMessages(); }, 5000);
    return () => clearInterval(interval);
}, [fetchMessages]);

async function sendMessage() {
    if (!input.trim() || !myId || sending) {
        return;
    }
    
    const messageText = input.trim();
    setSending(true);
    setError(null);
    scrollForNewMessages.current = true;
    
    // Clear input immediately 
    setInput('');
    
    // Create a temporary message with a local ID to show immediately
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
        id: tempId,
        senderId: myId,
        receiverId: otherUserId,
        message: messageText,
        timestamp: new Date().toISOString()
    };
    
    // Add temporary message to the UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Then send to server
    try {
        const newMessage = {
            receiverId: otherUserId,
            message: messageText,
        };

        const response = await axiosInstance.post('messages/send', newMessage);
        const savedMessage = response.data?.data as Message | undefined;
        if (!response.data?.success || !savedMessage?.id) {
            throw new Error('Invalid message response');
        }
        
        setMessages(prev => mergeItems(prev.filter(msg => msg.id !== tempId), [savedMessage], item => item.id));
        void fetchMessages();
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to send message';
        setError(errorMessage);
        console.error('Error sending message:', err.response?.data?.code || 'REQUEST_FAILED');
        
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setInput(value => value || messageText);
    } finally {
        setSending(false);
    }
}

// Match the server's stable insertion-order history; pending local messages stay last.
const sortedMessages = React.useMemo(() => [...messages].sort((a, b) => {
    if (a.id.startsWith('temp-') !== b.id.startsWith('temp-')) return a.id.startsWith('temp-') ? 1 : -1;
    return a.id.localeCompare(b.id);
}), [messages]);
const newestId = sortedMessages[sortedMessages.length - 1]?.id;
useEffect(() => {
    scrollForNewMessages.current = true;
}, [newestId]);

const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
        styles.messageContainer,
        item.senderId === myId ? styles.myMessageContainer : styles.theirMessageContainer
    ]}>
        <Text style={item.senderId === myId ? styles.myMessageText : styles.theirMessageText}>
            {item.message}
        </Text>
        {item.timestamp && (
            <Text style={[
                styles.timestamp,
                item.senderId === myId ? styles.myTimestamp : styles.theirTimestamp
            ]}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        )}
    </View>
);

return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
        </View>

        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={90}
        >
            {isLoading && messages.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <Text>Loading messages...</Text>
                </View>
            ) : (error || fetchError) && messages.length === 0 ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || fetchError}</Text>
                    <Button title="Retry" onPress={retryMessages} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={sortedMessages}
                    keyExtractor={keyExtractor}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    inverted={false}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={<View>
                        {(error || fetchError) && <Text style={styles.errorText}>{error || fetchError}</Text>}
                        {hasMore && <Button title={loadingMore ? 'Loading...' : 'Load older messages'} disabled={loadingMore}
                            onPress={() => { scrollForNewMessages.current = false; void loadMore(); }} />}
                    </View>}
                    onContentSizeChange={() => {
                        if (scrollForNewMessages.current) flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your message..."
                    placeholderTextColor="#999"
                    multiline
                    maxLength={4000}
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                    disabled={!input.trim() || sending}
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
safeArea: { flex: 1, backgroundColor: '#fff' },
header: { padding: 16, backgroundColor: '#5E8BFF', alignItems: 'center' },
headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
container: { flex: 1 },
messagesList: { paddingHorizontal: 16, paddingBottom: 10 },
inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'flex-end'
},
input: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    maxHeight: 100
},
sendButton: {
    marginLeft: 10,
    justifyContent: 'flex-end',
    paddingBottom: 8
},
messageContainer: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 10,
    maxWidth: '75%'
},
myMessageContainer: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end'
},
theirMessageContainer: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start'
},
myMessageText: { color: '#000' },
theirMessageText: { color: '#000' },
timestamp: {
    fontSize: 10,
    marginTop: 4
},
myTimestamp: {
    alignSelf: 'flex-end',
    color: '#555'
},
theirTimestamp: {
    alignSelf: 'flex-start',
    color: '#555'
},
loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
errorContainer: { padding: 20, alignItems: 'center' },
errorText: { color: 'red', marginBottom: 10 }
});
