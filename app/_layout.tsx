import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '../components/useColorScheme';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { AppLockProvider } from '../components/AppLockProvider';
import IncomingCallHUD from '../components/chat/IncomingCallHUD';

// Define how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

function AuthStateListener() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth Listener] Event: ${event}, Session: ${!!session}`);
      
      const inAuthGroup = segments[0] === 'auth';

      if (!session && !inAuthGroup) {
        console.log('[Auth Listener] User signed out, redirecting to /auth');
        router.replace('/auth');
      } else if (session && inAuthGroup) {
        console.log('[Auth Listener] User signed in, redirecting to /(tabs)');
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // 1. Listen for foreground notifications
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Foreground notification received:', notification);
    });

    // 2. Listen for notification click responses (Deep Linking)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Push] Notification tapped, interaction response received');
      const data = response.notification.request.content.data;
      const { conversationId, type } = data || {};

      if (conversationId) {
        if (type === 'call') {
          console.log(`[Push] Deep linking to call screen for conversation: ${conversationId}`);
          router.push(`/call/${conversationId}?role=receiver` as any);
        } else {
          console.log(`[Push] Deep linking to chat thread for conversation: ${conversationId}`);
          router.push(`/thread/${conversationId}` as any);
        }
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthStateListener />
      <AppLockProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="thread/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="call/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="compose" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <IncomingCallHUD />
      </AppLockProvider>
    </ThemeProvider>
  );
}
