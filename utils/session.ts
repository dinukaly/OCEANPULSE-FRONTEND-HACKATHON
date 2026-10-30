import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'oceanpulse.accessToken';

export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveSession = async (token: string, user: { userId: string; username: string }) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
  await AsyncStorage.multiSet([
    ['userId', String(user.userId)],
    ['username', user.username],
  ]);
  await AsyncStorage.removeItem('token'); // Remove the old plain-storage key.
};

export const clearSession = async () => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
  await AsyncStorage.multiRemove(['token', 'userId', 'username', 'user', 'tempToken', 'resetToken']);
};
