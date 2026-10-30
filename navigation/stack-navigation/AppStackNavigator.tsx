import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/stack-navigation/AppStackParamList';
import HomeBottomTabNavigation from '../tab-navigation/HomeBottomTabNavigation';
import SosScreen from '@/components/ui/screen/home/EmergencySosScreen';
import ChatScreen from '@/components/ui/screen/home/ChatScreen';
import UserListScreen from '@/components/ui/screen/home/UserListScreen';

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
    </Stack.Navigator>
  );
}
