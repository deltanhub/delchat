import * as ExpoHaptics from 'expo-haptics';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { ImpactFeedbackStyle, NotificationFeedbackType };

const HAPTICS_STORAGE_KEY = '@delchat_haptics_enabled';

// In-memory synchronous flag for zero-latency execution
let _hapticsEnabled: boolean = true;
const listeners = new Set<(enabled: boolean) => void>();

// Initialize from storage on module load
(async () => {
  try {
    const stored = await AsyncStorage.getItem(HAPTICS_STORAGE_KEY);
    if (stored !== null) {
      _hapticsEnabled = stored === 'true';
      listeners.forEach((listener) => listener(_hapticsEnabled));
    }
  } catch (e) {
    // Fallback to default (true)
  }
})();

export async function impactAsync(
  style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Light
): Promise<void> {
  if (!_hapticsEnabled) return;
  try {
    await ExpoHaptics.impactAsync(style);
  } catch (e) {
    // Ignore unsupported platforms/devices
  }
}

export async function notificationAsync(
  type: ExpoHaptics.NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType.Success
): Promise<void> {
  if (!_hapticsEnabled) return;
  try {
    await ExpoHaptics.notificationAsync(type);
  } catch (e) {
    // Ignore unsupported platforms/devices
  }
}

export async function selectionAsync(): Promise<void> {
  if (!_hapticsEnabled) return;
  try {
    await ExpoHaptics.selectionAsync();
  } catch (e) {
    // Ignore unsupported platforms/devices
  }
}

export const AppHaptics = {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  selectionAsync,

  /**
   * Returns current haptics enabled state synchronously
   */
  getHapticsEnabled(): boolean {
    return _hapticsEnabled;
  },

  /**
   * Set haptics enabled state, persist to storage, and notify listeners
   */
  async setHapticsEnabled(enabled: boolean): Promise<void> {
    _hapticsEnabled = enabled;
    listeners.forEach((listener) => listener(enabled));
    try {
      await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to save haptics preference', e);
    }
  },

  /**
   * Subscribe to haptics setting changes
   */
  subscribe(listener: (enabled: boolean) => void): () => void {
    listeners.add(listener);
    listener(_hapticsEnabled);
    return () => {
      listeners.delete(listener);
    };
  },
};

export default AppHaptics;
