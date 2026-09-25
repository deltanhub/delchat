import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type * as ExpoNotificationsType from 'expo-notifications';

/**
 * In Expo SDK 53+, remote push notifications were removed from the Android Expo Go client.
 * Static evaluation of 'expo-notifications' triggers DevicePushTokenAutoRegistration, which
 * calls addPushTokenListener and throws an uncaught fatal exception on Android inside Expo Go.
 * 
 * This module conditionally loads 'expo-notifications' only outside of Android Expo Go,
 * providing safe, non-crashing mock/fallback handlers in Expo Go, while seamlessly binding
 * to the full native push module in EAS Development Builds and Standalone Production APKs.
 */
export const isAndroidExpoGo = Platform.OS === 'android' && isRunningInExpoGo();

let rawNotificationsModule: typeof ExpoNotificationsType | null = null;

if (!isAndroidExpoGo) {
  try {
    rawNotificationsModule = require('expo-notifications');
  } catch (error) {
    console.warn('[Notifications] Failed to dynamically load expo-notifications:', error);
  }
}

export enum SafeAndroidImportance {
  UNKNOWN = 0,
  UNSPECIFIED = 1,
  NONE = 2,
  MIN = 3,
  LOW = 4,
  DEFAULT = 5,
  HIGH = 6,
  MAX = 7,
}

export enum SafeAndroidNotificationVisibility {
  UNKNOWN = 0,
  PUBLIC = 1,
  PRIVATE = 2,
  SECRET = 3,
}

const fallbackNotifications = {
  AndroidImportance: SafeAndroidImportance,
  AndroidNotificationVisibility: SafeAndroidNotificationVisibility,
  setNotificationHandler: (_handler: any) => {
    // No-op in Android Expo Go
  },
  addNotificationReceivedListener: (_listener: (notification: any) => void) => {
    return {
      remove: () => {},
    };
  },
  addNotificationResponseReceivedListener: (_listener: (response: any) => void) => {
    return {
      remove: () => {},
    };
  },
  setNotificationChannelAsync: async (_channelId: string, _channel: any) => {
    return null;
  },
  getPermissionsAsync: async () => {
    return {
      status: 'undetermined' as const,
      granted: false,
      canAskAgain: true,
      expires: 'never' as const,
    };
  },
  requestPermissionsAsync: async (_permissions?: any) => {
    return {
      status: 'denied' as const,
      granted: false,
      canAskAgain: false,
      expires: 'never' as const,
    };
  },
  getExpoPushTokenAsync: async (_options?: any) => {
    console.warn(
      '[Notifications] Remote push notifications are not supported in Android Expo Go (SDK 53+). Use an EAS development build or standalone production APK.'
    );
    return { data: '', type: 'expo' };
  },
};

const targetObj = (rawNotificationsModule || fallbackNotifications) as unknown as object;

export const Notifications: typeof ExpoNotificationsType = new Proxy(
  targetObj as typeof ExpoNotificationsType,
  {
    get(target, prop) {
      if (rawNotificationsModule) {
        const rawRecord = rawNotificationsModule as unknown as Record<string | symbol, unknown>;
        if (prop in rawNotificationsModule || rawRecord[prop] !== undefined) {
          const val = rawRecord[prop];
          if (typeof val === 'function') {
            if (prop === 'setNotificationChannelAsync') {
              return (channelId: string, channelOptions: any) => {
                // Defensive sanitization: On Android, passing sound: 'default' triggers
                // "Custom sound 'default' not found in native app" because native Android expects
                // a custom sound filename. Omitting sound defaults to Settings.System.DEFAULT_NOTIFICATION_URI.
                if (channelOptions && channelOptions.sound === 'default') {
                  const { sound, ...rest } = channelOptions;
                  return (rawNotificationsModule as any).setNotificationChannelAsync(channelId, rest);
                }
                return (val as (...args: unknown[]) => unknown).call(rawNotificationsModule, channelId, channelOptions);
              };
            }
            return (val as (...args: unknown[]) => unknown).bind(rawNotificationsModule);
          }
          return val;
        }
      }
      const fallbackRecord = fallbackNotifications as unknown as Record<string | symbol, unknown>;
      if (prop in fallbackNotifications) {
        return fallbackRecord[prop];
      }
      if (prop === 'AndroidImportance') {
        return SafeAndroidImportance;
      }
      if (prop === 'AndroidNotificationVisibility') {
        return SafeAndroidNotificationVisibility;
      }
      return (...args: unknown[]) => {
        console.warn(
          `[Notifications] Safe fallback called for "${String(prop)}" in Android Expo Go.`
        );
        return Promise.resolve(null);
      };
    },
  }
);
