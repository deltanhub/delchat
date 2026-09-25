import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEY_SAVED_PIN,
  STORAGE_KEY_PIN_REQUIRED,
  STORAGE_KEY_BIOMETRICS_ENABLED,
} from './types';

export async function getSavedChatPin(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_SAVED_PIN);
  } catch {
    return null;
  }
}

export async function saveChatPinLocal(pin: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SAVED_PIN, pin);
  } catch (err) {
    console.warn('[ChatSecurityService] saveChatPinLocal error:', err);
  }
}

export async function clearSavedChatPinLocal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SAVED_PIN);
  } catch (err) {
    console.warn('[ChatSecurityService] clearSavedChatPinLocal error:', err);
  }
}

export async function isPinRequiredOnDevice(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_PIN_REQUIRED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export async function setPinRequiredOnDevice(required: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PIN_REQUIRED, required ? 'true' : 'false');
  } catch (err) {
    console.warn('[ChatSecurityService] setPinRequiredOnDevice error:', err);
  }
}

export async function isBiometricsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRICS_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_BIOMETRICS_ENABLED, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('[ChatSecurityService] setBiometricsEnabled error:', err);
  }
}
