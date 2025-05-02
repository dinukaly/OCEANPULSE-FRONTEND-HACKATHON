import HomePageScreen from '@/components/ui/screen/home/HomePageScreen';
import { createStackNavigator } from '@react-navigation/stack';
import HomeBottomTabNavigation from '../tab-navigation/HomeBottomTabNavigation';
import SignupScreen from '@/components/ui/screen/security/SignupScreen';
import LoginScreen from '@/components/ui/screen/security/LoginScreen';
import PasswordResetScreen from '@/components/ui/screen/security/PasswordResetScreen';
import SetNewPasswordScreen from '@/components/ui/screen/security/SetNewPasswordScreen';
import WelcomePageScreen from '@/components/ui/screen/home/WelcomePageScreen';
import ForgotPasswordScreen from '@/components/ui/screen/security/ForgotPasswordScreen';
import VerifyOtpScreen from '@/components/ui/screen/security/VerifyOtpScreen';

const Stack = createStackNavigator();
export default function StackNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name={'Process'}
                options={{ headerLeft: () => null, headerShown: false }}
                component={HomeBottomTabNavigation} />
            <Stack.Screen name={'Welcome'}
                options={{ title: '', headerLeft: () => null, headerShown: false }}
                component={WelcomePageScreen} />
            <Stack.Screen name={'Signup'}
                options={{ title: '', headerLeft: () => null, headerShown: false }}
                component={SignupScreen} />
            <Stack.Screen name={'Login'}
                options={{ title: '', headerLeft: () => null, headerShown: false }}
                component={LoginScreen} />
            <Stack.Screen name={'ResetPasswordOtpVefication'}
                options={{ title: '' }}
                component={PasswordResetScreen} />
            <Stack.Screen name={'ForgotPassword'}
                options={{ title: '' }}
                component={ForgotPasswordScreen} />
            <Stack.Screen name={'SetNewPassword'}
                options={{ title: 'Set New Password' }}
                component={SetNewPasswordScreen} />
            <Stack.Screen name={'VerifyOtp'}
                options={{ title: 'verify otp' }}
                component={VerifyOtpScreen} />


        </Stack.Navigator>

    )
}