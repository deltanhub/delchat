import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { messageRepository } from '../../../lib/repositories/messageRepository';
import OfflineEngine from '../../../lib/offline-engine';
import { setCachedMessages } from '../../../lib/cache-manager';
import type { ChatMessage } from '../../../components/chat/bubbles/types';

export function useMessagePagination(
  conversationId: string,
  currentUser: any,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setLoadingMessages: (val: boolean) => void,
  hasMoreMessages: boolean,
  setHasMoreMessages: (val: boolean) => void,
  loadingMore: boolean,
  setLoadingMore: (val: boolean) => void,
  setStarredMsgIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    if (OfflineEngine.getMessagesSync(conversationId).length === 0 && messages.length === 0) {
      setLoadingMessages(true);
    }
    try {
      const { data: participantsData } = await supabase
        .from('chat_participants')
        .select('user_id, last_read_at')
        .eq('conversation_id', conversationId);

      const partnerParticipant = (participantsData || []).find((p: any) => p.user_id !== currentUser.id);
      const partnerLastReadTime = partnerParticipant?.last_read_at ? new Date(partnerParticipant.last_read_at).getTime() : null;

      const result = await messageRepository.fetchThreadMessages({
        conversationId,
        currentUserId: currentUser.id,
        limit: 30,
        partnerLastReadTime,
      });

      setMessages((prev) => {
        const pendingOptimistic = prev.filter((m) => m.status === 'sending');
        if (pendingOptimistic.length === 0) {
          return result.messages;
        }
        const serverIds = new Set(result.messages.map((m) => m.id));
        const activePending = pendingOptimistic.filter((m) => !serverIds.has(m.id));
        return [...activePending, ...result.messages];
      });
      setHasMoreMessages(result.hasMore);
      setStarredMsgIds(result.starredMsgIds);

      void OfflineEngine.saveMessages(conversationId, result.messages);
      void setCachedMessages(
        conversationId,
        result.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderUserId: m.senderUserId || '',
          createdAt: m.sentAt,
          messageKind: m.messageKind,
        }))
      );

      await supabase.rpc('mark_chat_conversation_read_atomic', {
        p_conversation_id: conversationId,
      });
    } catch (err) {
      console.warn('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, currentUser, messages.length, setHasMoreMessages, setLoadingMessages, setMessages, setStarredMsgIds]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !currentUser || loadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }
    const oldestMsg = messages[messages.length - 1];
    if (!oldestMsg?.sentAt) return;

    setLoadingMore(true);
    try {
      const result = await messageRepository.fetchThreadMessages({
        conversationId,
        currentUserId: currentUser.id,
        limit: 30,
        beforeTimestamp: oldestMsg.sentAt,
      });

      if (result.messages.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      setHasMoreMessages(result.hasMore);

      if (result.starredMsgIds.size > 0) {
        setStarredMsgIds((prev) => {
          const next = new Set(prev);
          result.starredMsgIds.forEach((id) => next.add(id));
          return next;
        });
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredNew = result.messages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...filteredNew];
      });
    } catch (err) {
      console.warn('Failed to paginate older messages', err);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, currentUser, loadingMore, hasMoreMessages, messages, setHasMoreMessages, setLoadingMore, setMessages, setStarredMsgIds]);

  return {
    fetchMessages,
    loadMoreMessages,
  };
}
