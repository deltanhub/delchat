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

const fallbackNotifications = {
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
  AndroidImportance: SafeAndroidImportance,
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
      return (...args: unknown[]) => {
        console.warn(
          `[Notifications] Safe fallback called for "${String(prop)}" in Android Expo Go.`
        );
        return Promise.resolve(null);
      };
    },
  }
);
