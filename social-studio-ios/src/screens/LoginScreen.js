import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      if (!result.success) setError('Wrong password. Try again.');
    } catch {
      setError('Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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

          <Text style={styles.subtitle}>
            AI-powered content in your voice.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#2a2a2a"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.buttonText}>Enter</Text>
            }
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingBottom: 60,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  eyebrowText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.muted,
    textTransform: 'uppercase',
  },

  heading: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 44,
    color: colors.text,
    lineHeight: 48,
    marginBottom: 10,
  },
  headingAccent: {
    color: colors.blue,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 48,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    marginBottom: 12,
  },

  errorBox: {
    backgroundColor: '#1a0808',
    borderWidth: 1,
    borderColor: '#ff4b2b44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.red,
    lineHeight: 19,
  },

  button: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 17,
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
