import { useEffect, useRef } from 'react';
import OfflineEngine from '../../lib/offline-engine';
import { supabase } from '../../lib/supabase';
import {
  UseThreadMessagesParams,
  useMessagesState,
  useMessagePagination,
  useMessageQueue,
  useThreadRealtime,
  useTextMessageSend,
  useStructuredMessageSend,
  useMessageItemActions,
} from './messages';

export type { UseThreadMessagesParams } from './messages';

export function useThreadMessages({
  conversationId,
  currentUser,
  partnerName,
  partnerUserId,
  ensureParticipantAuthorization,
  clearPartnerTyping,
  sendTyping,
}: UseThreadMessagesParams) {
  // Synchronous Frame 1 hydration: OfflineEngine.getMessagesSync(conversationId)
  const state = useMessagesState(conversationId, currentUser, partnerName);

  const { fetchMessages, loadMoreMessages } = useMessagePagination(
    conversationId,
    currentUser,
    state.messages,
    state.setMessages,
    state.setLoadingMessages,
    state.hasMoreMessages,
    state.setHasMoreMessages,
    state.loadingMore,
    state.setLoadingMore,
    state.setStarredMsgIds
  );

  const fetchMessagesRef = useRef(fetchMessages);
  fetchMessagesRef.current = fetchMessages;

  useEffect(() => {
    if (currentUser && conversationId) {
      void fetchMessagesRef.current();
    }
  }, [currentUser, conversationId]);

  const { retryPendingMessage, flushPendingQueue } = useMessageQueue(
    conversationId,
    currentUser,
    partnerUserId,
    ensureParticipantAuthorization,
    state.setMessages
  );

  // Dedicated realtime lifecycle channel with Phoenix topic deduplication:
  // channelName: `chat-thread-realtime-${conversationId}`
  // Lifecycle guard: supabase.getChannels().find(...) -> supabase.removeChannel(existing)
  // Immediate cache persistence: OfflineEngine.saveSingleMessage(conversationId, msg)
  useThreadRealtime(
    conversationId,
    currentUser,
    partnerName,
    clearPartnerTyping,
    state.setMessages,
    flushPendingQueue
  );

  const handleSendMessage = useTextMessageSend(
    conversationId,
    currentUser,
    partnerUserId,
    state.composerText,
    state.setComposerText,
    state.replyingToMessage,
    state.setReplyingToMessage,
    sendTyping,
    ensureParticipantAuthorization,
    state.setRateLimitCooldown,
    state.setMessages,
    retryPendingMessage
  );

  const structuredSends = useStructuredMessageSend(
    conversationId,
    currentUser,
    partnerUserId,
    ensureParticipantAuthorization,
    fetchMessages
  );

  const itemActions = useMessageItemActions(
    currentUser,
    state.messages,
    state.setMessages,
    state.starredMsgIds,
    state.setStarredMsgIds,
    fetchMessages
  );

  return {
    ...state,
    fetchMessages,
    loadMoreMessages,
    handleSendMessage,
    ...structuredSends,
    ...itemActions,
  };
}
