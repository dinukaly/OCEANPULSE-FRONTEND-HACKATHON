import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '@/store';
import getBaseUrl from '@/constants/BASEURL';
import { COLORS } from '@/constants/ColorPallet';
import axiosInstance from '@/utils/api';

type User = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function UserListScreen({ navigation }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = useSelector((state: RootState) => state.auth.userId);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<{ success: boolean; data: User[] }>( 
        `${getBaseUrl()}users/users`
      );
   
      const otherUsers = response.data.data.filter((user: User) => user.userId !== currentUserId);
      setUsers(otherUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    console.log('Selected user object:', user);
  
    navigation.navigate('ChatScreen', {
      otherUserId: user.userId,
      otherUserName: `${user.firstName} ${user.lastName}`,
    });
  };
  
  

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.firstName[0]}
          {item.lastName[0]}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{`${item.firstName} ${item.lastName}`}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No other users found</Text>
        }
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
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lighBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});