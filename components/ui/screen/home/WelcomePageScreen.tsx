import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import ActionButton from '@/components/ui/ActionButton';
import { theme } from '@/constants/theme';

const features = [
  { icon: 'weather-partly-cloudy', title: 'Weather context', description: 'Check conditions before heading out.' },
  { icon: 'map-outline', title: 'Route view', description: 'Keep your journey in view.' },
  { icon: 'alert-circle-outline', title: 'SOS recording', description: 'Record a request on the server. No rescue is dispatched.' },
];

export default function WelcomePageScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}><Icon source="waves" size={24} color="#FFFFFF" /></View>
            <Text style={styles.brand}>OCEANPULSE</Text>
          </View>
          <Text style={styles.eyebrow}>YOUR COASTAL COMPANION</Text>
          <Text style={styles.headline} accessibilityRole="header">A clearer view of the water ahead.</Text>
          <Text style={styles.subtitle}>Plan your route, check conditions, and stay connected from one place.</Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.entryCard}>
          <Text style={styles.entryTitle}>Get started</Text>
          <Text style={styles.entryDescription}>Sign in to your account or create one to explore OceanPulse.</Text>
          <ActionButton label="Sign in" onPress={() => navigation.navigate('Login')} style={styles.firstButton} />
          <ActionButton label="Create an account" variant="secondary" onPress={() => navigation.navigate('Signup')} style={styles.secondButton} />
        </View>
        <Text style={styles.featuresLabel}>IN THE APP</Text>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIcon}><Icon source={feature.icon} size={23} color={theme.colors.accent} /></View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, backgroundColor: theme.colors.background },
  hero: { backgroundColor: '#123D5B', paddingHorizontal: theme.spacing.lg, paddingTop: 52, paddingBottom: 100 },
  heroInner: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 60 },
  brandIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, marginRight: theme.spacing.sm },
  brand: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  eyebrow: { color: '#B6DCEB', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: theme.spacing.md },
  headline: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', maxWidth: 470 },
  subtitle: { color: '#E0EDF4', fontSize: theme.type.body, marginTop: theme.spacing.md, maxWidth: 440 },
  content: { width: '100%', maxWidth: 608, alignSelf: 'center', marginTop: -60, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  entryCard: { borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: theme.spacing.lg, shadowColor: '#123D5B', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  entryTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  entryDescription: { color: theme.colors.mutedText, fontSize: theme.type.body, marginTop: theme.spacing.xs },
  firstButton: { marginTop: theme.spacing.lg },
  secondButton: { marginTop: theme.spacing.sm },
  featuresLabel: { color: theme.colors.mutedText, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md },
  featureIcon: { width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.infoSurface, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  featureText: { flex: 1 },
  featureTitle: { color: theme.colors.text, fontSize: theme.type.body, fontWeight: '700' },
  featureDescription: { color: theme.colors.mutedText, fontSize: theme.type.caption, marginTop: theme.spacing.xs },
});
