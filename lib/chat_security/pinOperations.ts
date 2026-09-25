import { supabase } from '../supabase';
import { DELTANHUB_API_URL } from './types';
import { saveChatGateSession } from './tokenStorage';
import { saveChatPinLocal } from './devicePreferences';

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
      await saveChatGateSession('cookie-session-unlocked', undefined, pinLength);
    }

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

    await saveChatPinLocal(pin.trim());
    return { ok: true, backupCodes: json.backupCodes, pinLength };
  } catch (err: any) {
    console.error('[ChatSecurityService] setupChatPin error:', err);
    return { ok: false, error: err.message || 'Unable to create chat PIN.' };
  }
}
