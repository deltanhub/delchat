import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from './supabase';

export interface ChatAccessStatus {
  configured: boolean;
  unlocked: boolean;
  pinLength: number | null;
  backupCodesRemaining: number;
  lastVerifiedAt: string | null;
  activeRecoveryRequest?: {
    id: string;
    status: string;
    createdAt: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
  } | null;
}

const STORAGE_KEY_TOKEN = '@delchat_chat_gate_token';
const STORAGE_KEY_EXPIRES_AT = '@delchat_chat_gate_expires_at';
const STORAGE_KEY_PIN_LENGTH = '@delchat_chat_gate_pin_length';
const STORAGE_KEY_SAVED_PIN = '@delchat_saved_chat_pin';
const STORAGE_KEY_PIN_REQUIRED = '@delchat_pin_required_on_device';
const STORAGE_KEY_BIOMETRICS_ENABLED = '@delchat_biometrics_enabled';

// In-memory cache for high-frequency access
let _cachedToken: string | null = null;
let _cachedExpiresAt: number | null = null;
let _cachedPinLength: number = 4;
let _initialized = false;

async function ensureInitialized(): Promise<void> {
  if (_initialized) return;
  try {
    const [token, expiresAt, pinLength] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_TOKEN),
      AsyncStorage.getItem(STORAGE_KEY_EXPIRES_AT),
      AsyncStorage.getItem(STORAGE_KEY_PIN_LENGTH),
    ]);

    if (token) {
      const expTime = expiresAt ? parseInt(expiresAt, 10) : 0;
      // If token is still valid
      if (!expTime || expTime > Date.now()) {
        _cachedToken = token;
        _cachedExpiresAt = expTime;
      } else {
        await clearChatGateSession();
      }
    }

    if (pinLength) {
      const parsedLen = parseInt(pinLength, 10);
      if (parsedLen === 4 || parsedLen === 6) {
        _cachedPinLength = parsedLen;
      }
    }
  } catch (err) {
    console.warn('[ChatSecurityService] Storage init error:', err);
  } finally {
    _initialized = true;
  }
}

// Eager initialization on load
ensureInitialized().catch(() => {});

export async function getStoredChatGateToken(): Promise<string | null> {
  await ensureInitialized();
  if (_cachedToken && _cachedExpiresAt && _cachedExpiresAt <= Date.now()) {
    await clearChatGateSession();
    return null;
  }
  return _cachedToken;
}

export function getCachedChatGateTokenSync(): string | null {
  if (_cachedToken && _cachedExpiresAt && _cachedExpiresAt <= Date.now()) {
    return null;
  }
  return _cachedToken;
}

export async function saveChatGateSession(
  token: string,
  expiresAtIso?: string,
  pinLength?: number
): Promise<void> {
  try {
    const expMs = expiresAtIso
      ? new Date(expiresAtIso).getTime()
      : Date.now() + 12 * 60 * 60 * 1000; // 12 hours fallback

    _cachedToken = token;
    _cachedExpiresAt = expMs;
    if (pinLength === 4 || pinLength === 6) {
      _cachedPinLength = pinLength;
    }

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEY_EXPIRES_AT, expMs.toString()),
      pinLength ? AsyncStorage.setItem(STORAGE_KEY_PIN_LENGTH, pinLength.toString()) : Promise.resolve(),
    ]);
  } catch (err) {
    console.error('[ChatSecurityService] Error saving chat gate session:', err);
  }
}

export async function clearChatGateSession(): Promise<void> {
  _cachedToken = null;
  _cachedExpiresAt = null;
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEY_EXPIRES_AT),
    ]);
  } catch (err) {
    console.error('[ChatSecurityService] Error clearing chat gate session:', err);
  }
}

const DELTANHUB_API_URL = (
  process.env.EXPO_PUBLIC_DELTANHUB_API_URL || 'https://deltanhub.com'
).replace(/\/+$/, '');

export async function fetchChatAccessStatus(): Promise<ChatAccessStatus | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;

    const gateToken = await getStoredChatGateToken();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (gateToken) {
      headers['x-chat-gate-token'] = gateToken;
    }

    const res = await fetch(`${DELTANHUB_API_URL}/api/chats/access/status`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[ChatSecurityService] Status check response not ok:', res.status, errJson);
      return null;
    }

    const data: ChatAccessStatus = await res.json();
    if (data.pinLength) {
      _cachedPinLength = data.pinLength;
      AsyncStorage.setItem(STORAGE_KEY_PIN_LENGTH, data.pinLength.toString()).catch(() => {});
    }

    return data;
  } catch (err) {
    console.warn('[ChatSecurityService] fetchChatAccessStatus error:', err);
    return null;
  }
}

export async function verifyChatPin(
  pin: string
): Promise<{ ok: boolean; pinLength?: number; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      return { ok: false, error: 'Please sign in to unlock chat.' };
    }

    const res = await fetch(`${DELTANHUB_API_URL}/api/chats/access/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ pin: pin.trim() }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: json.error || 'Incorrect chat PIN. Please try again.' };
    }

    const returnedToken = json.chatGateToken;
    const expiresAt = json.expiresAt;
    const pinLength = json.pinLength || pin.trim().length;

    if (returnedToken) {
      await saveChatGateSession(returnedToken, expiresAt, pinLength);
    } else {
      // Fallback timestamp session for cookie-only backend
      await saveChatGateSession('cookie-session-unlocked', undefined, pinLength);
    }

    // Securely cache PIN for Face ID / auto-unlock on this device
    await saveChatPinLocal(pin.trim());

    return { ok: true, pinLength };
  } catch (err: any) {
    console.error('[ChatSecurityService] verifyChatPin error:', err);
    return { ok: false, error: err.message || 'Unable to verify chat PIN.' };
  }
}

export async function setupChatPin(
  pin: string,
  confirmPin: string
): Promise<{ ok: boolean; backupCodes?: string[]; pinLength?: number; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      return { ok: false, error: 'Please sign in to configure chat PIN.' };
    }

    const res = await fetch(`${DELTANHUB_API_URL}/api/chats/access/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        pin: pin.trim(),
        confirmPin: confirmPin.trim(),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: json.error || 'Unable to create chat PIN.' };
    }

    const returnedToken = json.chatGateToken;
    const expiresAt = json.expiresAt;
    const pinLength = json.pinLength || pin.trim().length;

    if (returnedToken) {
      await saveChatGateSession(returnedToken, expiresAt, pinLength);
    } else {
      await saveChatGateSession('cookie-session-unlocked', undefined, pinLength);
    }

    // Securely cache PIN for Face ID / auto-unlock on this device
    await saveChatPinLocal(pin.trim());

    return { ok: true, backupCodes: json.backupCodes, pinLength };
  } catch (err: any) {
    console.error('[ChatSecurityService] setupChatPin error:', err);
    return { ok: false, error: err.message || 'Unable to create chat PIN.' };
  }
}

export async function lockChatRemote(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const gateToken = await getStoredChatGateToken();

    await clearChatGateSession();

    if (token) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (gateToken) {
        headers['x-chat-gate-token'] = gateToken;
      }

      await fetch(`${DELTANHUB_API_URL}/api/chats/access/lock`, {
        method: 'POST',
        headers,
        credentials: 'include',
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[ChatSecurityService] lockChatRemote error:', err);
  }
}

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

export async function checkBiometricsAvailable(): Promise<{
  available: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Biometrics' | null;
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return { available: false, biometryType: null };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let biometryType: 'FaceID' | 'TouchID' | 'Biometrics' = 'Biometrics';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'FaceID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'TouchID';
    }

    return { available: true, biometryType };
  } catch {
    return { available: false, biometryType: null };
  }
}

export async function authenticateWithBiometrics(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { available, biometryType } = await checkBiometricsAvailable();
    if (!available) {
      return { ok: false, error: 'Biometrics not available or not enrolled.' };
    }

    const savedPin = await getSavedChatPin();
    if (!savedPin) {
      return { ok: false, error: 'Please enter your PIN manually first to enable biometric unlock.' };
    }

    const promptMessage = biometryType === 'FaceID'
      ? 'Unlock DelChat with Face ID'
      : biometryType === 'TouchID'
      ? 'Unlock DelChat with Touch ID'
      : 'Unlock DelChat with Biometrics';

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Enter PIN',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { ok: false, error: 'Biometric authentication cancelled.' };
    }

    return await verifyChatPin(savedPin);
  } catch (err: any) {
    return { ok: false, error: err.message || 'Biometric authentication error.' };
  }
}
