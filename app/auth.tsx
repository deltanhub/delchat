import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';
import { AuthHeader, AuthForm, AuthFooter, authStyles as styles } from '../components/auth';

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

  const handleOpenSignUp = async () => {
    const signupUrl = 'https://deltanhub.com/auth?tab=register';
    try {
      if (Platform.OS !== 'web') {
        await WebBrowser.openBrowserAsync(signupUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: colors.primary,
          controlsColor: '#ffffff',
        });
      } else {
        await Linking.openURL(signupUrl);
      }
    } catch {
      Linking.openURL(signupUrl);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedPageWrapper>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            <AuthHeader colorScheme={colorScheme} colors={colors} />
            <AuthForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              loading={loading}
              errorMessage={errorMessage}
              onSignIn={handleSignIn}
              onOpenSignUp={handleOpenSignUp}
              colors={colors}
            />
            <AuthFooter colors={colors} />
          </View>
        </KeyboardAvoidingView>
      </AnimatedPageWrapper>
    </View>
  );
}
