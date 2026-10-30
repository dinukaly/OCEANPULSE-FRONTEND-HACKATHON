import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/ColorPallet';
import WeatherScreen from '@/components/ui/screen/home/WeatherScreen';
import RouteScreen from '@/components/ui/screen/home/RouteScreen';
import HomePageScreen from '@/components/ui/screen/home/HomePageScreen';
import SeaWaveConditionScreen from '@/components/ui/screen/home/SeaWaveConditionScreen';
import ProfileScreen from '@/components/ui/screen/home/ProfileScreen';

export type HomeTabParamList = {
  Weather: undefined;
  Route: undefined;
  Home: undefined;
  SeaWave: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();
const icons = {
  Weather: { active: 'thunderstorm', inactive: 'thunderstorm-outline' },
  Route: { active: 'map', inactive: 'map-outline' },
  Home: { active: 'home', inactive: 'home-outline' },
  SeaWave: { active: 'boat', inactive: 'boat-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
} as const;

function SeaWaveTab() {
  return (
    <SeaWaveConditionScreen />
  );
}

export default function HomeBottomTabNavigation() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={icons[route.name][focused ? 'active' : 'inactive']}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: COLORS.lighBlue,
        tabBarInactiveTintColor: COLORS.darkGray,
      })}
    >
      <Tab.Screen name="Weather" component={WeatherScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Route" component={RouteScreen} />
      <Tab.Screen name="Home" component={HomePageScreen} options={{ headerShown: false }} />
      <Tab.Screen name="SeaWave" component={SeaWaveTab} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
