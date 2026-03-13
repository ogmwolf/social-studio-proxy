import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await login(password.trim());
      if (!result.success) {
        setError('Wrong password. Try again.');
      }
    } catch (e) {
      setError('Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.eyebrow}>
          <View style={styles.dot} />
          <Text style={styles.eyebrowText}>SOCIAL STUDIO</Text>
        </View>

        <Text style={styles.heading}>
          Social{'\n'}<Text style={styles.headingAccent}>Studio</Text>
        </Text>

        <Text style={styles.subtitle}>AI-powered content in your voice.</Text>

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.buttonText}>Enter</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  eyebrowText: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 40,
    fontFamily: 'Syne_800ExtraBold',
    color: colors.text,
    lineHeight: 44,
    marginBottom: 8,
  },
  headingAccent: {
    color: colors.blue,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 40,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 11,
    color: colors.red,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.bg,
  },
});
