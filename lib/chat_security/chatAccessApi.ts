import { supabase } from '../supabase';
import { ChatAccessStatus, DELTANHUB_API_URL } from './types';
import {
  getStoredChatGateToken,
  clearChatGateSession,
  setCachedPinLength,
} from './tokenStorage';

export async function fetchChatAccessStatus(): Promise<ChatAccessStatus | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;

    const gateToken = await getStoredChatGateToken();
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
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
      setCachedPinLength(data.pinLength);
    }
    return data;
  } catch (err) {
    console.warn('[ChatSecurityService] fetchChatAccessStatus error:', err);
    return null;
  }
}

export async function lockChatRemote(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const gateToken = await getStoredChatGateToken();

    await clearChatGateSession();

    if (token) {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
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
