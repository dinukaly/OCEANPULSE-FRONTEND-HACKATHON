import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getBaseUrl from '@/constants/BASEURL';

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Properly format the Bearer token
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401 responses
      try {
        await AsyncStorage.multiRemove(['token', 'userId', 'username', 'user']);
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;