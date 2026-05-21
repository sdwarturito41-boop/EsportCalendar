import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';
import { Wordmark } from './Wordmark';

export interface AuthScreenProps {
  mode: 'login' | 'signup';
  onSubmit: (email: string, password: string) => Promise<{ error?: string }>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Email + mot de passe requis');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await onSubmit(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brand}>
        <Wordmark size="big" />
        <Text variant="ui.body" tone="muted" style={styles.subtitle}>
          {isLogin ? 'Bon retour.' : 'Bienvenue.'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text variant="ui.label" tone="muted">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            placeholderTextColor={Colors.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            editable={!loading}
          />
        </View>
        <View style={styles.field}>
          <Text variant="ui.label" tone="muted">Mot de passe</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.text.muted}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            style={styles.input}
            editable={!loading}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text variant="ui.caption" tone="loss">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            (loading || pressed) && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.primary} />
          ) : (
            <Text variant="ui.label" tone="primary">
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Text>
          )}
        </Pressable>

        <View style={styles.switchRow}>
          <Text variant="ui.caption" tone="muted">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          </Text>
          <Link href={isLogin ? '/signup' : '/login'} replace asChild>
            <Pressable hitSlop={8}>
              <Text variant="ui.label" tone="accent">
                {isLogin ? "S'inscrire" : 'Se connecter'}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  brand: { alignItems: 'flex-start', marginBottom: Spacing.xxl },
  subtitle: { marginTop: Spacing.xs },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  input: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: 'Geist-Medium',
    fontSize: 15,
    color: Colors.text.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(232, 64, 74, 0.12)',
    borderWidth: 1,
    borderColor: Colors.semantic.loss,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  button: {
    backgroundColor: Colors.accent.indigo,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPressed: { opacity: 0.85 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
