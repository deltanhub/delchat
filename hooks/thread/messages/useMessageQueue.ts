import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { messageRepository } from '../../../lib/repositories/messageRepository';
import OfflineEngine from '../../../lib/offline-engine';
import SyncCoordinator, { broadcastInboxAlert } from '../../../lib/sync-coordinator';
import { getPendingQueue, removePendingMessage } from '../../../lib/cache-manager';
import type { ChatMessage } from '../../../components/chat/bubbles/types';

export function useMessageQueue(
  conversationId: string,
  currentUser: any,
  partnerUserId: string | null | undefined,
  ensureParticipantAuthorization: () => Promise<boolean>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  const retryPendingMessage = useCallback(async (tempId: string, text: string, replySnapshot?: any) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      const data = await messageRepository.sendTextMessage({
        conversationId,
        senderUserId: currentUser.id,
        body: text,
        intent: 'general',
        replySnapshot,
      });

      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: data.id, sentAt: data.createdAt, status: 'sent' } : m))
        );
        await removePendingMessage(conversationId, tempId);
        await OfflineEngine.removeOutbox(tempId);
        await OfflineEngine.updateMessageStatus(conversationId, tempId, data.id, 'sent', data.createdAt);
        broadcastInboxAlert({
          recipientUserId: partnerUserId,
          conversationId,
          senderUserId: currentUser.id,
        });
      }
    } catch (retryErr: any) {
      console.warn('Pending message retry deferred:', retryErr?.message);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, setMessages]);

  const flushPendingQueue = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    try {
      await SyncCoordinator.drainOutbox(supabase, conversationId, (tempId, serverData) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: serverData.id, sentAt: serverData.created_at, status: 'sent' }
              : m
          )
        );
      });

      const pending = await getPendingQueue(conversationId);
      if (pending && pending.length > 0) {
        for (const item of pending) {
          await retryPendingMessage(item.id, item.body);
        }
      }
    } catch (err) {
      console.warn('Error flushing pending queue:', err);
    }
  }, [conversationId, currentUser, retryPendingMessage, setMessages]);

  const flushRef = useRef(flushPendingQueue);
  flushRef.current = flushPendingQueue;

  useEffect(() => {
    if (currentUser?.id && conversationId) {
      void flushRef.current();
    }
  }, [currentUser?.id, conversationId]);

  return {
    retryPendingMessage,
    flushPendingQueue,
  };
}
