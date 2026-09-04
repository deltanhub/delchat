import { supabase } from './supabase';

const DELTANHUB_API_URL = (
  process.env.EXPO_PUBLIC_DELTANHUB_API_URL || 'https://deltanhub.com'
).replace(/\/+$/, '');

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${DELTANHUB_API_URL}${endpoint}`;

  console.log(`[API Client] Request to: ${url}`);
  let response = await fetch(url, {
    ...options,
    headers,
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
      });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API Client] Error response: ${response.status} - ${errorText}`);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}
