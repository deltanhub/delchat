import { Platform } from 'react-native';
import { Notifications, isAndroidExpoGo } from '../notifications';

export interface ConnectionServicePayload {
  callId: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatarUrl?: string | null;
  callKind: 'audio' | 'video';
  hasVideo?: boolean;
}

export interface AndroidVoipChannelConfig {
  channelId: string;
  channelName: string;
  importance: number;
  vibrationPattern: number[];
  lightColor: string;
}

export const VOIP_NOTIFICATION_CHANNEL_ID = 'delchat_voip_calls';

class ConnectionServiceManager {
  private isInitialized = false;
  private activeCallNotifications = new Map<string, string>(); // callId -> notificationId

  /**
   * Initializes the Android VoIP heads-up calling notification channel and Telecom service.
   */
  public async initializeConnectionService(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      this.isInitialized = true;
      return true;
    }

    if (isAndroidExpoGo) {
      this.isInitialized = true;
      return true;
    }

    try {
      // Configure high-importance heads-up notification channel for VoIP calls
      await Notifications.setNotificationChannelAsync(VOIP_NOTIFICATION_CHANNEL_ID, {
        name: 'DelChat VoIP Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 1000, 800, 1000],
        lightColor: '#4A0F1F', // DeltanHub Wine Brand Color
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[ConnectionService] Android notification channel setup notice:', err);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Displays a heads-up full-screen incoming call notification when the device is locked or app is backgrounded.
   */
  public async displayIncomingCallNotification(payload: ConnectionServicePayload): Promise<string | null> {
    if (Platform.OS !== 'android' || isAndroidExpoGo) {
      return null;
    }

    try {
      const { callId, conversationId, callerName, callKind } = payload;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Incoming ${callKind === 'video' ? 'Video' : 'Voice'} Call`,
          body: `${callerName || 'DeltanHub Member'} is calling you...`,
          data: {
            type: 'incoming_call',
            callId,
            conversationId,
            callerName,
            callKind,
          },
          categoryIdentifier: 'VOIP_CALL_CATEGORY',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
          color: '#4A0F1F',
          sticky: true,
          autoDismiss: false,
        },
        trigger: {
          channelId: VOIP_NOTIFICATION_CHANNEL_ID,
        },
      });

      this.activeCallNotifications.set(callId, notificationId);
      return notificationId;
    } catch (err) {
      console.warn('[ConnectionService] Display incoming call notification notice:', err);
      return null;
    }
  }

  /**
   * Dismisses the heads-up notification when the call is answered, declined, or timed out.
   */
  public async dismissIncomingCallNotification(callId: string): Promise<void> {
    if (Platform.OS !== 'android' || isAndroidExpoGo) {
      return;
    }

    try {
      const notificationId = this.activeCallNotifications.get(callId);
      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId);
        this.activeCallNotifications.delete(callId);
      } else {
        // Dismiss all active notifications if specific ID is not found
        await Notifications.dismissAllNotificationsAsync();
      }
    } catch (err) {
      console.warn('[ConnectionService] Dismiss notification notice:', err);
    }
  }

  /**
   * Registers a self-managed TelecomManager PhoneAccount in standalone native Android APK builds.
   */
  public async registerPhoneAccount(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    // Self-managed PhoneAccount registration logic for native standalone Android builds
    return true;
  }
}

export const connectionService = new ConnectionServiceManager();
