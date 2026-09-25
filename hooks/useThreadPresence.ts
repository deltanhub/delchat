import { formatWhatsAppLastSeen } from '../lib/presence-utils';
import {
  UseThreadPresenceOptions,
  UseThreadPresenceReturn,
  usePresenceSync,
  useTypingBroadcast,
} from './presence';

export * from './presence/types';

/**
 * useThreadPresence
 * Clean Architecture hook managing realtime online presence and typing broadcasts.
 * Synchronized with DeltanHub Web presence channels and touch_user_presence RPC:
 * - Realtime presence channel: `presence:${conversationId}`
 * - Realtime typing channel: `chat-typing:${conversationId}`
 * - Touch presence RPC: `touch_user_presence`
 *
 * Realtime lifecycle & channel deduplication:
 * supabase.getChannels().find(...) -> supabase.removeChannel(existing)
 */
export function useThreadPresence({
  conversationId,
  currentUserId,
  partnerUserId,
  initialLastSeenAt = null,
  fallbackSubtitle,
}: UseThreadPresenceOptions): UseThreadPresenceReturn {
  const { isPartnerOnline, partnerLastSeenAt } = usePresenceSync({
    conversationId,
    currentUserId,
    partnerUserId,
    initialLastSeenAt,
  });

  const {
    isPartnerTyping,
    sendTyping,
    clearPartnerTyping,
    handleComposerTextChange,
  } = useTypingBroadcast({
    conversationId,
    currentUserId,
  });

  const lastSeenText = formatWhatsAppLastSeen(
    partnerLastSeenAt,
    isPartnerOnline,
    isPartnerTyping,
    fallbackSubtitle
  );

  return {
    isPartnerOnline,
    isPartnerTyping,
    partnerLastSeenAt,
    lastSeenText,
    sendTyping,
    clearPartnerTyping,
    handleComposerTextChange,
  };
}
