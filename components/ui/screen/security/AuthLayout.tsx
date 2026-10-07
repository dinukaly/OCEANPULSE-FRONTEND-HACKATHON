import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { theme } from '@/constants/theme';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthLayout({ eyebrow, title, description, children }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}><Icon source="waves" size={22} color="#FFFFFF" /></View>
              <Text style={styles.brand}>OCEANPULSE</Text>
            </View>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.card}>{children}</View>
          <Text style={styles.footer}>Navigate with clarity. Stay connected at sea.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1 },
  hero: { backgroundColor: '#123D5B', paddingTop: theme.spacing.xl, paddingBottom: 76, paddingHorizontal: theme.spacing.lg },
  heroInner: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  brandIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm },
  brand: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  eyebrow: { color: '#B6DCEB', fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: theme.spacing.sm },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  description: { color: '#E0EDF4', fontSize: theme.type.body, marginTop: theme.spacing.sm },
  content: { width: '100%', maxWidth: 608, alignSelf: 'center', paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, marginTop: -48 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, shadowColor: '#123D5B', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  footer: { color: theme.colors.mutedText, fontSize: theme.type.caption, textAlign: 'center', marginTop: theme.spacing.lg },
});
