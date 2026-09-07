import { supabase } from './supabase';
import { getCachedChatGateTokenSync, getStoredChatGateToken } from './chat-security-service';

const DELTANHUB_API_URL = (
  process.env.EXPO_PUBLIC_DELTANHUB_API_URL || 'https://deltanhub.com'
).replace(/\/+$/, '');

type ChatPinChallengeHandler = () => Promise<boolean>;
let _pinChallengeHandler: ChatPinChallengeHandler | null = null;

/**
 * Registers a global handler to be invoked when an API request receives
 * a 403 'Unlock chat with your PIN first' challenge.
 */
export function registerChatPinChallengeHandler(handler: ChatPinChallengeHandler | null): void {
  _pinChallengeHandler = handler;
}

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<any> {
  let { data: { session } } = await supabase.auth.getSession();

  // Proactively refresh token if expired or about to expire within 60s
  if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    console.log('[API Client] Proactively refreshing expiring session token...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshData?.session) {
      session = refreshData.session;
    }
  }

  const token = session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject chat gate token for authenticated chat security
  const gateToken = getCachedChatGateTokenSync();
  if (gateToken && !headers.has('x-chat-gate-token')) {
    headers.set('x-chat-gate-token', gateToken);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${DELTANHUB_API_URL}${endpoint}`;

  console.log(`[API Client] Request to: ${url}`);
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 Unauthorized with token refresh & retry once
  if (response.status === 401 && !isRetry) {
    console.log('[API Client] 401 received, attempting session refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshData?.session?.access_token) {
      headers.set('Authorization', `Bearer ${refreshData.session.access_token}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // Handle 403 Forbidden with Chat PIN Challenge & retry once
  if (response.status === 403 && !isRetry) {
    const errorBody = await response.clone().text().catch(() => '');
    if (
      errorBody.includes('Unlock chat with your PIN first.') ||
      errorBody.includes('Create your chat PIN before using chat.')
    ) {
      console.log('[API Client] 403 Chat PIN challenge required. Triggering challenge handler...');
      if (_pinChallengeHandler) {
        const unlocked = await _pinChallengeHandler();
        if (unlocked) {
          const freshGateToken = await getStoredChatGateToken();
          if (freshGateToken) {
            headers.set('x-chat-gate-token', freshGateToken);
          }
          return fetchWithAuth(endpoint, options, true);
        }
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[API Client] Error response: ${response.status} - ${errorText}`);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}
