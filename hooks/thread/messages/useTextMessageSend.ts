import { useCallback } from 'react';
import { messageRepository } from '../../../lib/repositories/messageRepository';
import { dispatchPushNotification } from '../../../lib/push-notifications';
import OfflineEngine from '../../../lib/offline-engine';
import { broadcastInboxAlert } from '../../../lib/sync-coordinator';
import { removePendingMessage } from '../../../lib/cache-manager';
import * as Haptics from '../../../lib/haptics';
import type { ChatMessage } from '../../../components/chat/bubbles/types';
import { enqueueFailedMessage } from './outboxHelper';

export function useTextMessageSend(
  conversationId: string,
  currentUser: any,
  partnerUserId: string | null | undefined,
  composerText: string,
  setComposerText: (text: string) => void,
  replyingToMessage: ChatMessage | null,
  setReplyingToMessage: (msg: ChatMessage | null) => void,
  sendTyping: (isTyping: boolean) => void,
  ensureParticipantAuthorization: () => Promise<boolean>,
  setRateLimitCooldown: (val: boolean) => void,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  retryPendingMessage: (tempId: string, text: string, replySnapshot?: any) => Promise<void>
) {
  return useCallback(async () => {
    if (!composerText.trim() || !conversationId || !currentUser) return;
    const text = composerText.trim();
    const replySnapshot = replyingToMessage;

    sendTyping(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComposerText('');
    setReplyingToMessage(null);

    const tempId = `optimistic-${Date.now()}`;
    const sentAt = new Date().toISOString();
    const structuredPayload = replySnapshot ? {
      replyTo: { messageId: replySnapshot.id, authorName: replySnapshot.authorName, body: replySnapshot.body },
    } : {};

    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderType: 'user',
      senderUserId: currentUser.id,
      authorName: 'You',
      authorRoleLabel: 'You',
      status: 'sending',
      messageKind: 'text',
      body: text,
      sentAt,
      intent: 'general',
      structuredPayload,
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      if (!(await ensureParticipantAuthorization())) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

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
        void dispatchPushNotification({
          conversationId,
          messageId: data.id,
          body: text,
          senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
          messageKind: 'text',
        });
        broadcastInboxAlert({ recipientUserId: partnerUserId, conversationId, senderUserId: currentUser.id });
      }
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      const isRateLimited = errMsg.includes('rate_limit') || err.code === 'P0001';

      if (isRateLimited) {
        console.warn('[Rate Limit Exceeded] Cooldown engaged, preserving in pending queue');
        setRateLimitCooldown(true);
        setTimeout(() => setRateLimitCooldown(false), 4000);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m)));
        await enqueueFailedMessage(conversationId, tempId, text, currentUser.id, sentAt, structuredPayload, 'Rate limit exceeded');
        setTimeout(async () => { await retryPendingMessage(tempId, text, replySnapshot); }, 3500);
      } else {
        console.warn('[Send Failed] Preserving in offline queue:', err);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m)));
        await enqueueFailedMessage(conversationId, tempId, text, currentUser.id, sentAt, structuredPayload, err?.message || 'Send error');
      }
    }
  }, [composerText, conversationId, currentUser, partnerUserId, replyingToMessage, sendTyping, setComposerText, setReplyingToMessage, setMessages, ensureParticipantAuthorization, setRateLimitCooldown, retryPendingMessage]);
}
