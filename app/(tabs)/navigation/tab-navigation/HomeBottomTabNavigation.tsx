import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { COLORS } from '@/constants/ColorPallet';
import WeatherScreen from '@/components/ui/screen/home/WeatherScreen';
import SosScreen from '@/components/ui/screen/home/EmergencySosScreen';
import HomePageScreen from '@/components/ui/screen/home/HomePageScreen';
import SeaWaveConditionScreen from '@/components/ui/screen/home/SeaWaveConditionScreen';
import RouteScreen from '@/components/ui/screen/home/RouteScreen';
import Communication from '@/components/ui/screen/home/Communication';
import { Ionicons } from "@expo/vector-icons";
import ProfileScreen from '@/components/ui/screen/home/ProfileScreen';

const logo = require('@/assets/logo/logo.png');
const Tab = createBottomTabNavigator();
export default function HomeBottomTabNavigation() {
    return (
        <Tab.Navigator
            initialRouteName={'Home'}
            screenOptions={({ route, focused }: any) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Weather') {
                        iconName = focused ? 'Weather' : 'thunderstorm-outline';
                    } else if (route.name === 'Route') {
                        iconName = focused ? 'Route' : 'map-outline';
                    } else if (route.name === 'SeaWave') {
                        iconName = focused ? 'seawave' : 'boat-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'account-circle-outline' : 'person-circle-outline';
                    } else if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    }
                    // @ts-ignore
                    return <Ionicons name={iconName} size={size} color={color} />
                },
                tabBarActiveTintColor: COLORS.lighBlue,
                tabBarInactiveTintColor: COLORS.darkGray
            })}
        >

            <Tab.Screen name={'Weather'} component={WeatherScreen}
                options={{ headerShown: false }} />
            <Tab.Screen name={'Route'} component={RouteScreen} />
            <Tab.Screen name={'Home'}
                component={HomePageScreen}
                options={{
                    // headerLeft:()=>(
                    //     <Image
                    //         source={logo}
                    //         style={{
                    //             width: 50,
                    //             height: 50,
                    //             borderRadius: 10,
                    //             marginLeft: 10
                    //         }}
                    //         resizeMode="contain"
                    //     />
                    // ),
                    // headerTitle:'',
                    headerShown: false

                }}
            />

            <Tab.Screen
                name={'SeaWave'}
                component={() => <SeaWaveConditionScreen latitude={0} longitude={0} selectedDate={new Date().toISOString()} />}
                options={{ headerShown: false }}
            />
            <Tab.Screen name={'Profile'} component={ProfileScreen}
                options={{ headerShown: false }}
            />
        </Tab.Navigator>
    )
}