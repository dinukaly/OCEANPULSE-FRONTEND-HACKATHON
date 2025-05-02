import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import SplashScreen from '@/components/ui/screen/SplashScreen';
import AuthStackNavigator from './navigation/stack-navigation/AuthStackNavigator';
import AppStackNavigator from './navigation/stack-navigation/AppStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store, { RootState } from '@/store';
import { setUserId, logout } from '@/store/authSlice';

function App() {
  const [isLoading, setLoading] = useState(true);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');

        const isAuth = !!(token && userId);

        if (isAuth && userId) {
          dispatch(setUserId(userId));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userId', 'username']);
      dispatch(logout());
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SplashScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </View>
  );
}

export default function EntryPoint() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
