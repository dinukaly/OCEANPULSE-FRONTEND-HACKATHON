import axios from 'axios';
import getBaseUrl from '@/constants/BASEURL';
import { clearSession, getToken } from '@/utils/session';
import store from '@/store';
import { logout } from '@/store/authSlice';

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
      const token = await getToken();
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
        await clearSession();
      } catch (e) {
        console.error('Error clearing auth data:', e);
      } finally {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
