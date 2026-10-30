import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { theme } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
};

export default function AuthField({ label, error, optional = false, ...inputProps }: Props) {
  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}>Optional</Text>}
      </View>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={error || inputProps.accessibilityHint}
        placeholderTextColor={theme.colors.mutedText}
        style={[styles.input, error && styles.inputError, inputProps.style]}
      />
      {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: theme.spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  label: { color: theme.colors.text, fontSize: theme.type.caption, fontWeight: '700' },
  optional: { color: theme.colors.mutedText, fontSize: theme.type.caption },
  input: { minHeight: theme.touchTarget, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: theme.type.body },
  inputError: { borderColor: theme.colors.danger, borderWidth: 2 },
  error: { color: theme.colors.danger, fontSize: theme.type.caption, marginTop: theme.spacing.xs },
});
