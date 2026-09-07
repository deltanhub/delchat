import { Notifications, isAndroidExpoGo } from './notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { fetchWithAuth } from './api-client';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isAndroidExpoGo) {
    console.warn(
      '[Push] Remote push notifications are disabled in Android Expo Go (SDK 53+). Please use an EAS development build or standalone production APK.'
    );
    return null;
  }

  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4a0f1f', // DeltanHub Wine Brand Color
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted for push notifications.');
    return null;
  }

  try {
    // Get Expo Push Token with project ID if available
    const configuredProjectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } })?.easConfig?.projectId;

    // Validate that projectId is a valid UUID before sending to Expo Notifications API
    const isValidUuid =
      typeof configuredProjectId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        configuredProjectId.trim()
      );

    if (configuredProjectId && !isValidUuid) {
      console.warn(
        `[Push] Configured projectId "${configuredProjectId}" is not a valid UUID; omitting explicit projectId parameter.`
      );
    }

    const tokenData = await Notifications.getExpoPushTokenAsync(
      isValidUuid ? { projectId: configuredProjectId.trim() } : undefined
    );
    token = tokenData.data;
    console.log('[Push] Registered Expo Push Token:', token);

    // Sync token directly to DeltanHub user_device_tokens table
    if (token) {
      await sendPushTokenToBackend(token);
    }
  } catch (error) {
    console.warn('[Push] Push token registration skipped or failed:', error);
  }

  return token;
}

export async function sendPushTokenToBackend(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[Push] User not authenticated yet; push token will sync upon login.');
      return;
    }

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    const { error } = await supabase
      .from('user_device_tokens')
      .upsert(
        {
          user_id: user.id,
          token: token.trim(),
          platform,
          device_name: Platform.OS === 'ios' ? 'iOS Client' : 'Android Client',
          app_version: '1.0.0',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.warn('[Push] Error syncing device token to user_device_tokens:', error.message);
    } else {
      console.log('[Push] Token successfully registered in user_device_tokens.');
    }
  } catch (error) {
    console.error('[Push] Failed to send push token to backend:', error);
  }
}

/**
 * Dispatches a push notification to conversation participants via the DeltanHub backend.
 * Fire-and-forget: failure does not block messaging.
 */
export async function dispatchPushNotification(params: {
  conversationId: string;
  messageId: string;
  body: string;
  senderName?: string;
  messageKind?: string;
}): Promise<void> {
  try {
    await fetchWithAuth('/api/chats/push-dispatch', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: params.conversationId,
        messageId: params.messageId,
        body: params.body || '',
        senderName: params.senderName || 'Member',
        messageKind: params.messageKind || 'text',
      }),
    });
  } catch (err) {
    console.warn('[PushDispatch] Non-blocking push dispatch notice:', err);
  }
}

export {
  dispatchVoipCallPush,
  dispatchVoipCallCancellation,
  type VoipCallPushParams,
  type VoipCallCancelParams,
} from './services/voipPushService';


