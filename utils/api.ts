import axios from 'axios';
import getBaseUrl, { assertApiConfigured } from '@/constants/BASEURL';
import { clearSession, getToken } from '@/utils/session';
import store from '@/store';
import { logout } from '@/store/authSlice';
import { logFailure } from './logging';

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    assertApiConfigured();
    try {
      const token = await getToken();
      if (token) {
        // Properly format the Bearer token
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      logFailure('session.read', error);
      throw new Error('Could not read your saved session. Please retry.');
    }
  },
  (error) => {
    return Promise.reject(error);
  },
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
        logFailure('session.clear', e);
      } finally {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  },
);

export default api;
