import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import ActionButton from '@/components/ui/ActionButton';
import StatusBanner from '@/components/ui/StatusBanner';
import AuthField from '@/components/ui/screen/security/AuthField';
import AuthLayout from '@/components/ui/screen/security/AuthLayout';
import { theme } from '@/constants/theme';
import { setUserId } from '@/store/authSlice';
import api from '@/utils/api';
import { saveSession } from '@/utils/session';
import { validateEmail, validateFields, validatePassword } from '@/utils/validation';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const dispatch = useDispatch();

  const validateInputs = () => {
    const emailValidation = validateEmail(email.trim());
    const passwordValidation = validatePassword(password);
    setErrors({ email: emailValidation.error, password: passwordValidation.error });
    return validateFields([emailValidation, passwordValidation]).isValid;
  };

  const handleLogin = async () => {
    if (loading || !validateInputs()) return;
    setRequestError('');
    try {
      setLoading(true);
      const response = await api.post('users/login', { email: email.trim(), password });
      const { data } = response.data;
      if (!data?.user) throw new Error('Invalid response structure from server');
      const { user, token } = data;
      if (data.requiresVerification) {
        navigation.navigate('VerifyOtp', { username: user.username, email: user.email });
      } else {
        if (!token) throw new Error('Missing access token');
        await saveSession(token, user);
        dispatch(setUserId(user.userId.toString()));
      }
    } catch (error: any) {
      setRequestError(error.response?.data?.message || 'Sign in failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Account access" title="Welcome back" description="Sign in to view your routes, conditions, and messages.">
      <Text style={styles.sectionTitle}>Sign in</Text>
      <Text style={styles.sectionDescription}>Enter the email and password for your OceanPulse account.</Text>
      {!!requestError && <StatusBanner tone="error" title="Could not sign in" message={requestError} style={styles.banner} />}
      <View style={styles.fields}>
        <AuthField
          label="Email address"
          value={email}
          onChangeText={(value) => { setEmail(value); setErrors((prev) => ({ ...prev, email: '' })); }}
          error={errors.email}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <AuthField
          label="Password"
          value={password}
          onChangeText={(value) => { setPassword(value); setErrors((prev) => ({ ...prev, password: '' })); }}
          error={errors.password}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
        />
      </View>
      <Pressable onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="button" style={styles.forgotButton}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>
      <ActionButton label="Sign in" onPress={handleLogin} loading={loading} style={styles.submit} />
      <View style={styles.divider} />
      <Text style={styles.switchPrompt}>New to OceanPulse?</Text>
      <ActionButton label="Create an account" variant="secondary" onPress={() => navigation.navigate('Signup')} style={styles.switchButton} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  sectionDescription: { color: theme.colors.mutedText, fontSize: theme.type.caption, marginTop: theme.spacing.xs },
  banner: { marginTop: theme.spacing.md },
  fields: { marginTop: theme.spacing.lg },
  forgotButton: { minHeight: theme.touchTarget, alignSelf: 'flex-end', justifyContent: 'center', marginTop: -theme.spacing.sm },
  link: { color: theme.colors.accent, fontSize: theme.type.caption, fontWeight: '700' },
  submit: { marginTop: theme.spacing.md },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
  switchPrompt: { color: theme.colors.mutedText, fontSize: theme.type.caption, textAlign: 'center' },
  switchButton: { marginTop: theme.spacing.sm },
});
