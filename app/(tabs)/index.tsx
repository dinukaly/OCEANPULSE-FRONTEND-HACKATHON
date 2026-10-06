import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import SplashScreen from '@/components/ui/screen/SplashScreen';
import AuthStackNavigator from './navigation/stack-navigation/AuthStackNavigator';
import AppStackNavigator from './navigation/stack-navigation/AppStackNavigator';
import store, { RootState } from '@/store';
import { setUserId, logout } from '@/store/authSlice';
import { clearSession, getToken } from '@/utils/session';
import api from '@/utils/api';
import getBaseUrl from '@/constants/BASEURL';

function App() {
  const [isLoading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  const checkAuthStatus = async () => {
    setLoading(true);
    setRestoreError(false);
    try {
      const token = await getToken();
      if (!token) {
        await clearSession();
        dispatch(logout());
        return;
      }
      const response = await api.get('users/profile');
      dispatch(setUserId(String(response.data.data.user.userId)));
    } catch (error: any) {
      if (error.response?.status === 401) {
        await clearSession();
        dispatch(logout());
      } else {
        setRestoreError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAuthStatus(); }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SplashScreen />
      </View>
    );
  }

  if (restoreError) {
    return <View style={styles.container}>
      <Text style={styles.restoreText}>Cannot verify your session. Check your connection and try again.</Text>
      <TouchableOpacity onPress={checkAuthStatus} accessibilityRole="button" style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>;
  }

  return (
    <View style={styles.container}>
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </View>
  );
}

export default function EntryPoint() {
  if (!getBaseUrl()) {
    return (
      <View style={styles.container}>
        <Text style={styles.restoreText}>
          API address is not configured. Set EXPO_PUBLIC_API_URL to a reachable URL ending in /api/v1/ and reload the app.
        </Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  restoreText: { margin: 24, marginTop: 80, fontSize: 18, color: '#222' },
  retryButton: { marginHorizontal: 24, padding: 16, backgroundColor: '#0456C7', borderRadius: 8 },
  retryText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
