import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type Tone = 'info' | 'warning' | 'error' | 'success';
type Props = {
  tone: Tone;
  title: string;
  message: string;
  style?: StyleProp<ViewStyle>;
};

const toneStyle = StyleSheet.create({
  info: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.accent,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
  },
  error: {
    backgroundColor: theme.colors.errorSurface,
    borderColor: theme.colors.danger,
  },
  success: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.success,
  },
});

export default function StatusBanner({ tone, title, message, style }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${message}`}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={[styles.container, toneStyle[tone], style]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.body,
    fontWeight: '700',
  },
  message: {
    color: theme.colors.text,
    fontSize: theme.type.body,
    marginTop: theme.spacing.sm,
  },
});
