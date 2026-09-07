import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, DarkTheme, DefaultTheme, ThemeProvider, type Href } from 'expo-router';
import { useColorScheme } from '../components/useColorScheme';
import { supabase } from '../lib/supabase';
import { Notifications, isAndroidExpoGo } from '../lib/notifications';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { AppLockProvider } from '../components/AppLockProvider';
import { ChatPinGateProvider } from '../components/chat/security/ChatPinGateProvider';
import IncomingCallHUD from '../components/chat/IncomingCallHUD';
import { callKit } from '../lib/voip/callkit';
import { connectionService } from '../lib/voip/connectionService';

// Prevent splash screen from auto-hiding before authentication/resources are initialized
SplashScreen.preventAutoHideAsync().catch(() => {});

// Define how notifications are handled when the app is in the foreground (only outside Android Expo Go)
if (!isAndroidExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

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
    // 0. Initialize native VoIP Calling subsystems (CallKit & ConnectionService)
    void callKit.initializeCallKit(
      { appName: 'DelChat' },
      {
        onAnswerCall: (callUuid) => {
          console.log('[CallKit] Call answered via native lock screen:', callUuid);
        },
        onEndCall: (callUuid) => {
          console.log('[CallKit] Call ended via native lock screen:', callUuid);
        },
      }
    );
    void connectionService.initializeConnectionService();

    // 1. Listen for foreground notifications (active in standalone/dev builds)
    const foregroundSubscription = !isAndroidExpoGo
      ? Notifications.addNotificationReceivedListener((notification) => {
          console.log('[Push] Foreground notification received:', notification);
        })
      : null;

    // 2. Listen for notification click responses (Deep Linking)
    const responseSubscription = !isAndroidExpoGo
      ? Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('[Push] Notification tapped, interaction response received');
          const data = response.notification.request.content.data;
          const { conversationId, type } = data || {};

          if (conversationId) {
            if (type === 'call' || type === 'incoming_call' || type === 'voip_call_incoming') {
              console.log(`[Push] Deep linking to call screen for conversation: ${conversationId}`);
              const callIdParam = data?.callId || data?.id || '';
              const callModeParam = data?.callMode || data?.kind || data?.callKind || 'audio';
              router.push(
                `/call/${conversationId}?role=receiver&callId=${callIdParam}&kind=${callModeParam}` as Href
              );
            } else {
              console.log(`[Push] Deep linking to chat thread for conversation: ${conversationId}`);
              router.push(`/thread/${conversationId}` as Href);
            }
          }
        })
      : null;

    // 3. Fallback timer to ensure splash screen is hidden under all network conditions
    const splashTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 2000);

    return () => {
      foregroundSubscription?.remove();
      responseSubscription?.remove();
      clearTimeout(splashTimer);
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthStateListener />
      <AppLockProvider>
        <ChatPinGateProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="thread/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="call/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="compose" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
          <IncomingCallHUD />
        </ChatPinGateProvider>
      </AppLockProvider>
    </ThemeProvider>
  );
}
