import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import Colors from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../components/useColorScheme';
import ScalePressable from '../components/ScalePressable';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password.trim(),
      });
      if (error) throw error;
      
      console.log('[DelChat SSO] Authentication successful for:', trimmedEmail);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('[DelChat SSO] Auth error:', err.message);
      setErrorMessage(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedPageWrapper>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            {/* Header / Brand */}
            <View style={styles.headerContainer}>
              <Text style={[styles.brandText, { color: colors.primary }]}>DelChat</Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                Sign in with your DeltanHub account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primaryMuted }]}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primaryMuted }]}>Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <ScalePressable
                onPress={handleSignIn}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </ScalePressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.placeholder }]}>
                Secure Connection via DeltanHub Identity Provider
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </AnimatedPageWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandText: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    opacity: 0.8,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: Typography.sizes.md,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
});
