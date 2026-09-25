import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEY_TOKEN,
  STORAGE_KEY_EXPIRES_AT,
  STORAGE_KEY_PIN_LENGTH,
} from './types';

// In-memory cache for high-frequency access
let _cachedToken: string | null = null;
let _cachedExpiresAt: number | null = null;
let _cachedPinLength: number = 4;
let _initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (_initialized) return;
  try {
    const [token, expiresAt, pinLength] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_TOKEN),
      AsyncStorage.getItem(STORAGE_KEY_EXPIRES_AT),
      AsyncStorage.getItem(STORAGE_KEY_PIN_LENGTH),
    ]);

    if (token) {
      const expTime = expiresAt ? parseInt(expiresAt, 10) : 0;
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
      : Date.now() + 12 * 60 * 60 * 1000;

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

export function setCachedPinLength(length: number): void {
  if (length === 4 || length === 6) {
    _cachedPinLength = length;
    AsyncStorage.setItem(STORAGE_KEY_PIN_LENGTH, length.toString()).catch(() => {});
  }
}

export function getCachedPinLength(): number {
  return _cachedPinLength;
}
