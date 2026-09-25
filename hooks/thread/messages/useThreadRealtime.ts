import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import OfflineEngine from '../../../lib/offline-engine';
import SyncCoordinator from '../../../lib/sync-coordinator';
import * as Haptics from '../../../lib/haptics';
import type { ChatMessage } from '../../../components/chat/bubbles/types';
import {
  resolveAttachmentsFromPayload,
  buildIncomingMessage,
  buildOutgoingMessage,
} from './realtimePayloadResolver';

export function useThreadRealtime(
  conversationId: string,
  currentUser: any,
  partnerName: string | undefined,
  clearPartnerTyping: () => void,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  flushPendingQueue: () => Promise<void>
) {
  const partnerNameRef = useRef(partnerName);
  partnerNameRef.current = partnerName;
  const clearTypingRef = useRef(clearPartnerTyping);
  clearTypingRef.current = clearPartnerTyping;

  useEffect(() => {
    const currentUserId = currentUser?.id;
    if (!conversationId || !currentUserId) return;

    const channelName = `chat-thread-realtime-${conversationId}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) {
      void supabase.removeChannel(existing);
    }

    const msgChannel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg || newMsg.intent === 'internal_note') return;
          const initialAttachments = resolveAttachmentsFromPayload(newMsg);

          if (newMsg.sender_user_id === currentUserId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const matching = prev.find((m) => m.status === 'sending' && m.body === newMsg.body);
              if (matching) {
                const confirmed: ChatMessage = {
                  ...matching,
                  id: newMsg.id,
                  status: 'sent',
                  sentAt: newMsg.created_at,
                  attachments: matching.attachments && matching.attachments.length > 0 ? matching.attachments : initialAttachments,
                };
                OfflineEngine.saveSingleMessage(conversationId, confirmed);
                return prev.map((m) => (m.id === matching.id ? confirmed : m));
              }
              const outgoing = buildOutgoingMessage(newMsg, initialAttachments);
              OfflineEngine.saveSingleMessage(conversationId, outgoing);
              return [outgoing, ...prev];
            });
            return;
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearTypingRef.current();
          void supabase.rpc('mark_chat_conversation_read_atomic', { p_conversation_id: conversationId });

          const incoming = buildIncomingMessage(newMsg, initialAttachments, partnerNameRef.current);
          OfflineEngine.saveSingleMessage(conversationId, incoming);
          setMessages((prev) => [incoming, ...prev.filter((m) => m.id !== newMsg.id)]);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          const updated = payload.new;
          if (!updated) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === updated.id) {
                const isRead = Boolean(updated.read_at || updated.message_status === 'read');
                const isDelivered = Boolean(updated.delivered_at || updated.message_status === 'delivered');
                return {
                  ...m,
                  status: isRead ? 'read' : isDelivered ? 'delivered' : m.status || 'sent',
                  readAt: updated.read_at || m.readAt,
                  deliveredAt: updated.delivered_at || m.deliveredAt,
                  body: updated.body || m.body,
                  reactions: updated.reactions !== undefined ? (updated.reactions || {}) : (updated.structured_payload?.reactions || m.reactions),
                };
              }
              return m;
            })
          );
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_participants', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          const updatedPart = payload.new;
          if (updatedPart && updatedPart.user_id !== currentUserId && updatedPart.last_read_at) {
            const readTime = new Date(updatedPart.last_read_at).getTime();
            setMessages((prev) =>
              prev.map((m) => {
                if (m.senderUserId === currentUserId && readTime >= new Date(m.sentAt).getTime()) {
                  return { ...m, status: 'read' };
                }
                return m;
              })
            );
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          SyncCoordinator.setStatus('online');
          try {
            const deltaMsgs = await SyncCoordinator.executeDeltaSync(supabase, conversationId, currentUserId);
            if (deltaMsgs && deltaMsgs.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                return [...deltaMsgs.filter((m) => !existingIds.has(m.id)), ...prev];
              });
            }
          } catch (deltaErr) {
            console.warn('[Realtime] Delta sync deferred:', deltaErr);
          }
          void flushPendingQueue();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          void SyncCoordinator.checkConnectivity();
        }
      });

    return () => {
      void supabase.removeChannel(msgChannel);
    };
  }, [conversationId, currentUser?.id, flushPendingQueue, setMessages]);
}
