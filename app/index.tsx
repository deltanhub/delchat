import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import { registerForPushNotificationsAsync } from '../lib/push-notifications';
import * as SplashScreen from 'expo-splash-screen';

export default function IndexScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('[DelChat] Active session found for:', session.user.email);
          // Register for push alerts asynchronously in the background
          registerForPushNotificationsAsync();
          router.replace('/(tabs)');
        } else {
          console.log('[DelChat] No active session found, redirecting to login.');
          router.replace('/auth');
        }
      } catch (err) {
        console.warn('[DelChat] Session check error:', err);
        router.replace('/auth');
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    checkSession();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
