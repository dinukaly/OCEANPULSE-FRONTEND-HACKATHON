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


type Message = {
id: string;
_id?: string;  // Add this for MongoDB-style IDs
senderId: string;
receiverId: string;
message: string;
timestamp?: string;
};

type ChatScreenParams = {
otherUserId: string;
otherUserName?: string;
};

export default function ChatScreen({ route }: { route: { params: ChatScreenParams } }) {
const { otherUserId, otherUserName } = route.params;
const myId = useSelector((state: RootState) => state.auth.userId);

console.log('🚀 My UserId:', myId);

const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Set up a polling mechanism for fetching messages
useEffect(() => {
    // Fetch messages immediately when component mounts
    fetchMessages();
    
    // Set up polling interval (every 5 seconds)
    const intervalId = setInterval(() => {
        if (myId && otherUserId) {
            fetchMessages();
        }
    }, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
}, [myId, otherUserId]);

async function fetchMessages() {
    // Don't fetch if we don't have valid IDs
    console.log('📦 myId:', myId, 'otherUserId:', otherUserId);

    if (!myId || !otherUserId) {
        console.log("Missing user IDs, skipping message fetch");
        return;
    }
    
    try {
        setIsLoading(prev => messages.length === 0 ? true : prev); // Only show loading if no messages yet
        setError(null);
        
        console.log('Fetching messages for users:', myId, otherUserId);
        const res = await axiosInstance.get('messages/get', {
            params: { user1: myId, user2: otherUserId },
        });
        
        if (!res.data?.success || !Array.isArray(res.data?.data)) {
            throw new Error('Invalid messages response');
        }
        const receivedMessages = res.data.data as Message[];
        setMessages(prev => {
            if (prev.length !== receivedMessages.length) return receivedMessages;
            const previousIds = new Set(prev.map(message => message.id));
            return receivedMessages.some(message => !previousIds.has(message.id))
                ? receivedMessages
                : prev;
        });
    } catch (err) {
        const errorMsg = 'Failed to fetch messages';
        console.error(errorMsg, err);

        if (messages.length === 0) {
            setError(errorMsg);
        }
    } finally {
        setIsLoading(false);
    }
}

async function sendMessage() {
    if (!input.trim() || !myId) {
        return;
    }
    
    const messageText = input.trim();
    
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
        
        // Replace temporary message with the one from server
        setMessages(prev => 
            prev.map(msg => msg.id === tempId ? savedMessage : msg)
        );
        
        // As a backup, also fetch all messages to ensure everything is in sync
        // but with a slight delay to prevent race conditions
        setTimeout(() => {
            fetchMessages();
        }, 1000);
        
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to send message';
        setError(errorMessage);
        console.error('Error sending message:', err);
        
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
}

// Sort messages by timestamp to ensure proper order
const sortedMessages = React.useMemo(() => {
    return [...messages].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB; // Ascending order - oldest to newest
    });
}, [messages]);

// Auto-scroll to bottom when new messages arrive
const flatListRef = React.useRef<FlatList>(null);

useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }
}, [messages]);

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
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Button title="Retry" onPress={fetchMessages} />
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
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                    disabled={!input.trim()}
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
