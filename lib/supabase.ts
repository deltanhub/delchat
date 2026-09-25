import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[Supabase] Init URL loaded:', !!supabaseUrl);
console.log('[Supabase] Init Key loaded:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * 500k CCU Realtime Channel Lifecycle Guard
 * Synchronously removes any stale or duplicate channel instance with the matching topic/subTopic
 * from the internal Supabase registry before returning a fresh channel.
 *
 * This prevents @supabase/realtime-js from throwing:
 * "cannot add 'postgres_changes' callbacks for realtime:... after 'subscribe()'"
 * when components re-render or remount during rapid incoming message streams or tab transitions.
 */
const originalChannel = supabase.channel.bind(supabase);

(supabase as any).channel = (name: string, opts?: any) => {
  const existing = supabase.getChannels().find(
    (ch) => ch.topic === `realtime:${name}` || (ch as any).subTopic === name
  );
  if (existing) {
    void supabase.removeChannel(existing);
    (supabase.realtime as any)?._remove?.(existing);
  }
  return originalChannel(name, opts);
};

/**
 * Explicit helper to retrieve or safely allocate a deduplicated RealtimeChannel.
 */
export function getCleanChannel(name: string, options?: any) {
  return supabase.channel(name, options);
}
