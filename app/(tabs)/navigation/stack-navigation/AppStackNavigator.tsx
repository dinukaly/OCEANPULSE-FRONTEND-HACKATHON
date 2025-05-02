import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/(tabs)/navigation/stack-navigation/AppStackParamList';
import HomeBottomTabNavigation from '../tab-navigation/HomeBottomTabNavigation';
import HomePageScreen from '@/components/ui/screen/home/HomePageScreen';
import SosScreen from '@/components/ui/screen/home/EmergencySosScreen';
import ChatScreen from '@/components/ui/screen/home/ChatScreen';
import UserListScreen from '@/components/ui/screen/home/UserListScreen';
import RouteScreen from '@/components/ui/screen/home/RouteScreen';
import WeatherScreen from '@/components/ui/screen/home/WeatherScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Process"
        component={HomeBottomTabNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DashboardScreen"
        component={HomePageScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="SOSSCREEN"
        component={SosScreen}
        options={{ title: 'SOS Screen' }}
      />
      <Stack.Screen
        name="UserListScreen"
        component={UserListScreen}
        options={{ title: 'Select User' }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
       <Stack.Screen
        name="RouteScreen"
        component={RouteScreen}
        options={{ title: 'Route Screen' }}
      />
       <Stack.Screen
        name="WeatherScreen"
        component={WeatherScreen}
        options={{ title: 'Weather' }}
      />
    </Stack.Navigator>
  );
}
