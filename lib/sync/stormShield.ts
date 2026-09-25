import { supabase } from '../supabase';

let _lastPresenceTouchTime = 0;
export const PRESENCE_TOUCH_THROTTLE_MS = 30000; // 30 seconds throttle per device
let _presenceTouchPromise: Promise<void> | null = null;

/**
 * Calculate randomized full jitter delay for reconnection storm defense.
 */
export function calculateJitter(minMs = 500, maxMs = 3500): number {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

/**
 * Throttle and deduplicate presence touches across 500,000 CCU.
 * Prevents simultaneous mass database write storms on network recovery.
 */
export async function touchUserPresenceSafely(client: any = supabase): Promise<void> {
  const now = Date.now();
  if (now - _lastPresenceTouchTime < PRESENCE_TOUCH_THROTTLE_MS) {
    return;
  }
  if (_presenceTouchPromise) {
    return _presenceTouchPromise;
  }

  _lastPresenceTouchTime = now;
  _presenceTouchPromise = (async () => {
    try {
      await client.rpc('touch_user_presence');
    } catch (err) {
      console.warn('[SyncCoordinator] touch_user_presence error:', err);
    } finally {
      _presenceTouchPromise = null;
    }
  })();

  return _presenceTouchPromise;
}
