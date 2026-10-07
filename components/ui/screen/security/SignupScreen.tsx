import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '@/components/ui/ActionButton';
import StatusBanner from '@/components/ui/StatusBanner';
import AuthField from '@/components/ui/screen/security/AuthField';
import AuthLayout from '@/components/ui/screen/security/AuthLayout';
import { theme } from '@/constants/theme';
import api from '@/utils/api';
import { validateBoatId, validateConfirmPassword, validateEmail, validateFields, validateName, validatePassword, validatePhone } from '@/utils/validation';

type FieldName = 'firstName' | 'lastName' | 'email' | 'contact' | 'password' | 'confirmPassword' | 'boatId';
const emptyErrors: Record<FieldName, string> = {
  firstName: '', lastName: '', email: '', contact: '', password: '', confirmPassword: '', boatId: '',
};

export default function SignupScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [boatId, setBoatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [errors, setErrors] = useState(emptyErrors);

  const clearError = (field: FieldName) => setErrors((previous) => ({ ...previous, [field]: '' }));

  const validateInputs = () => {
    const first = validateName(firstName.trim(), 'First name');
    const last = validateName(lastName.trim(), 'Last name');
    const mail = validateEmail(email.trim());
    const phone = validatePhone(contact.trim());
    const boat = validateBoatId(boatId.trim());
    const pass = validatePassword(password);
    const confirmation = validateConfirmPassword(password, confirmPassword);
    setErrors({ firstName: first.error, lastName: last.error, email: mail.error, contact: phone.error, boatId: boat.error, password: pass.error, confirmPassword: confirmation.error });
    return validateFields([first, last, mail, phone, boat, pass, confirmation]).isValid;
  };

  const handleRegister = async () => {
    if (loading || !validateInputs()) return;
    setRequestError('');
    try {
      setLoading(true);
      const response = await api.post('users/register', {
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
        contact: contact.trim(), password, boatId: boatId.trim(),
      });
      const { data } = response.data;
      if (!data?.user) throw new Error('Invalid response from server');
      navigation.navigate('VerifyOtp', { username: data.user.username, email: data.user.email });
    } catch (error: any) {
      setRequestError(error.response?.data?.message || 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Join OceanPulse" title="Create your account" description="Set up your account to access routes, conditions, and messages.">
      <Text style={styles.sectionTitle}>Your details</Text>
      <Text style={styles.sectionDescription}>We’ll email a verification code after you create your account.</Text>
      {!!requestError && <StatusBanner tone="error" title="Could not create account" message={requestError} style={styles.banner} />}
      <View style={styles.fields}>
        <AuthField label="First name" value={firstName} onChangeText={(value) => { setFirstName(value); clearError('firstName'); }} error={errors.firstName} placeholder="First name" autoComplete="given-name" textContentType="givenName" />
        <AuthField label="Last name" value={lastName} onChangeText={(value) => { setLastName(value); clearError('lastName'); }} error={errors.lastName} placeholder="Last name" autoComplete="family-name" textContentType="familyName" />
        <AuthField label="Email address" value={email} onChangeText={(value) => { setEmail(value); clearError('email'); }} error={errors.email} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <AuthField label="Boat ID" optional value={boatId} onChangeText={(value) => { setBoatId(value.toUpperCase()); clearError('boatId'); }} error={errors.boatId} placeholder="B001" autoCapitalize="characters" accessibilityHint="Optional. Format: one letter followed by three numbers." />
        <AuthField label="Contact number" value={contact} onChangeText={(value) => { setContact(value); clearError('contact'); }} error={errors.contact} placeholder="+94771234567" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
        <View style={styles.divider} />
        <Text style={styles.subheading}>Secure your account</Text>
        <Text style={styles.passwordHint}>Use at least 8 characters with a letter and a number.</Text>
        <AuthField label="Password" value={password} onChangeText={(value) => { setPassword(value); clearError('password'); }} error={errors.password} placeholder="Create a password" secureTextEntry autoComplete="new-password" textContentType="newPassword" />
        <AuthField label="Confirm password" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); clearError('confirmPassword'); }} error={errors.confirmPassword} placeholder="Enter password again" secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      </View>
      <ActionButton label="Create account" onPress={handleRegister} loading={loading} />
      <View style={styles.divider} />
      <Text style={styles.switchPrompt}>Already have an account?</Text>
      <ActionButton label="Sign in" variant="secondary" onPress={() => navigation.navigate('Login')} style={styles.switchButton} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  sectionDescription: { color: theme.colors.mutedText, fontSize: theme.type.caption, marginTop: theme.spacing.xs },
  banner: { marginTop: theme.spacing.md },
  fields: { marginTop: theme.spacing.lg },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
  subheading: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: theme.spacing.xs },
  passwordHint: { color: theme.colors.mutedText, fontSize: theme.type.caption, marginBottom: theme.spacing.lg },
  switchPrompt: { color: theme.colors.mutedText, fontSize: theme.type.caption, textAlign: 'center' },
  switchButton: { marginTop: theme.spacing.sm },
});
