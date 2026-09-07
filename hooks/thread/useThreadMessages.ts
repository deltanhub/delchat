import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { messageRepository } from '../../lib/repositories/messageRepository';
import type { ChatMessage, ChatAttachmentItem } from '../../components/chat/bubbles/types';
import type { SelectedListing } from '../../components/chat/PropertyCatalogModal';
import type { SelectedInquiryTemplate } from '../../components/chat/InquiryFormModal';
import { dispatchPushNotification } from '../../lib/push-notifications';
import OfflineEngine from '../../lib/offline-engine';
import SyncCoordinator from '../../lib/sync-coordinator';
import {
  getCachedMessages,
  setCachedMessages,
  getPendingQueue,
  addPendingMessage,
  removePendingMessage,
} from '../../lib/cache-manager';
import * as Haptics from '../../lib/haptics';

export interface UseThreadMessagesParams {
  conversationId: string;
  currentUser: any;
  partnerName?: string;
  ensureParticipantAuthorization: () => Promise<boolean>;
  clearPartnerTyping: () => void;
  sendTyping: (isTyping: boolean) => void;
}

export function useThreadMessages({
  conversationId,
  currentUser,
  partnerName,
  ensureParticipantAuthorization,
  clearPartnerTyping,
  sendTyping,
}: UseThreadMessagesParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [starredMsgIds, setStarredMsgIds] = useState<Set<string>>(new Set());

  // Optimistic message manipulation helpers for media / voice hooks
  const addOptimisticMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [msg, ...prev]);
  }, []);

  const updateOptimisticMessage = useCallback((tempId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, ...updates } : m))
    );
  }, []);

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  // Fetch messages using messageRepository
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    setLoadingMessages(true);
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

      setMessages(result.messages);
      setHasMoreMessages(result.hasMore);
      setStarredMsgIds(result.starredMsgIds);

      // Cache locally for offline resilience & fast start
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

      // Atomically mark conversation as read
      await supabase.rpc('mark_chat_conversation_read_atomic', {
        p_conversation_id: conversationId,
      });
    } catch (err) {
      console.warn('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, currentUser]);

  // Keyset cursor pagination for older messages
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
  }, [conversationId, currentUser, loadingMore, hasMoreMessages, messages]);

  // Initial rich cache paint
  useEffect(() => {
    if (currentUser && conversationId) {
      OfflineEngine.getMessages(conversationId).then((richCached) => {
        if (richCached && richCached.length > 0 && messages.length === 0) {
          setMessages(richCached);
          setLoadingMessages(false);
        } else {
          getCachedMessages(conversationId).then((cached) => {
            if (cached && cached.length > 0 && messages.length === 0) {
              setMessages(
                cached.map((c) => ({
                  id: c.id,
                  senderType: 'user',
                  senderUserId: c.senderUserId,
                  authorName: c.senderUserId === currentUser.id ? 'You' : (partnerName || 'Partner'),
                  authorRoleLabel: 'Member',
                  status: c.isPending ? 'sending' : 'sent',
                  messageKind: (c.messageKind as ChatMessage['messageKind']) || 'text',
                  body: c.body,
                  sentAt: c.createdAt,
                  intent: 'general',
                  attachments: [],
                  reactions: {},
                  structuredPayload: {},
                }))
              );
              setLoadingMessages(false);
            }
          });
        }
      });
      fetchMessages();
    }
  }, [currentUser, conversationId, fetchMessages, partnerName]);

  // Helper to retry sending a pending/rate-limited message
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
      }
    } catch (retryErr: any) {
      console.warn('Pending message retry deferred:', retryErr?.message);
    }
  }, [conversationId, currentUser, ensureParticipantAuthorization]);

  // Flush offline pending queue
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
  }, [conversationId, currentUser, retryPendingMessage]);

  useEffect(() => {
    if (currentUser && conversationId) {
      flushPendingQueue();
    }
  }, [currentUser, conversationId, flushPendingQueue]);

  // Realtime Messages & Receipts Channel
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const msgChannel = supabase
      .channel(`chat-thread-realtime-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg || newMsg.intent === 'internal_note') return;

          let initialAttachments: any[] = [];
          if (Array.isArray(newMsg.structured_payload?.attachments)) {
            initialAttachments = newMsg.structured_payload.attachments.map((att: any, idx: number) => ({
              id: att.id || `${newMsg.id}-att-${idx}`,
              url: att.url,
              originalName: att.originalName || att.original_name || 'Attachment',
              mimeType: att.mimeType || att.mime_type || (att.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
              sizeBytes: att.sizeBytes || att.size_bytes || 0,
              kind: att.kind || 'image',
            }));
          } else if (newMsg.structured_payload?.document) {
            const doc = newMsg.structured_payload.document;
            initialAttachments = [
              {
                id: `${newMsg.id}-doc`,
                url: doc.url,
                originalName: doc.name || 'Document',
                mimeType: doc.mimeType || 'application/pdf',
                sizeBytes: doc.size || 0,
                kind: 'document',
              },
            ];
          }

          if (newMsg.sender_user_id === currentUser.id) {
            setMessages((prev) => {
              const alreadyExists = prev.some((m) => m.id === newMsg.id);
              if (alreadyExists) return prev;

              const matchingOptimistic = prev.find(
                (m) => m.status === 'sending' && m.body === newMsg.body
              );

              if (matchingOptimistic) {
                return prev.map((m) =>
                  m.id === matchingOptimistic.id
                    ? {
                        ...m,
                        id: newMsg.id,
                        status: 'sent',
                        sentAt: newMsg.created_at,
                        attachments: m.attachments && m.attachments.length > 0 ? m.attachments : initialAttachments,
                      }
                    : m
                );
              }

              return [
                {
                  id: newMsg.id,
                  senderType: newMsg.sender_type || 'user',
                  senderUserId: newMsg.sender_user_id,
                  authorName: 'You',
                  authorRoleLabel: 'You',
                  status: 'sent',
                  messageKind: newMsg.message_kind || 'text',
                  body: newMsg.body || '',
                  sentAt: newMsg.created_at,
                  intent: newMsg.intent,
                  attachments: initialAttachments,
                  listingCard: newMsg.structured_payload?.listingCard || null,
                  inquiryFormCard: newMsg.structured_payload?.inquiryFormCard || (newMsg.message_kind === 'inquiry_form' ? newMsg.structured_payload : null),
                  inquiryResponseCard: newMsg.structured_payload?.inquiryResponseCard || (newMsg.message_kind === 'inquiry_response' ? newMsg.structured_payload : null),
                  reactions: newMsg.structured_payload?.reactions || {},
                  structuredPayload: newMsg.structured_payload || {},
                },
                ...prev,
              ];
            });
            return;
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearPartnerTyping();

          void supabase.rpc('mark_chat_conversation_read_atomic', {
            p_conversation_id: conversationId,
          });

          setMessages((prev) => [
            {
              id: newMsg.id,
              senderType: newMsg.sender_type || 'user',
              senderUserId: newMsg.sender_user_id,
              authorName: partnerName || 'Partner',
              authorRoleLabel: 'Seller',
              status: 'delivered',
              messageKind: newMsg.message_kind || 'text',
              body: newMsg.body || '',
              sentAt: newMsg.created_at,
              intent: newMsg.intent,
              attachments: initialAttachments,
              listingCard: newMsg.structured_payload?.listingCard || null,
              inquiryFormCard: newMsg.structured_payload?.inquiryFormCard || (newMsg.message_kind === 'inquiry_form' ? newMsg.structured_payload : null),
              inquiryResponseCard: newMsg.structured_payload?.inquiryResponseCard || (newMsg.message_kind === 'inquiry_response' ? newMsg.structured_payload : null),
              reactions: newMsg.structured_payload?.reactions || {},
              structuredPayload: newMsg.structured_payload || {},
            },
            ...prev.filter((m) => m.id !== newMsg.id),
          ]);

          if (newMsg.message_kind === 'attachments') {
            void (async () => {
              try {
                const { data: attRows } = await supabase
                  .from('chat_message_attachments')
                  .select('*')
                  .eq('message_id', newMsg.id);

                if (attRows && attRows.length > 0) {
                  const resolved = await Promise.all(
                    attRows.map(async (att: any) => {
                      let finalUrl = att.storage_path;
                      const bucket = att.storage_bucket || 'chat-attachments';
                      try {
                        const { data: signedData } = await supabase.storage
                          .from(bucket)
                          .createSignedUrl(att.storage_path, 86400);
                        if (signedData?.signedUrl) finalUrl = signedData.signedUrl;
                      } catch {}
                      return {
                        id: att.id,
                        url: finalUrl,
                        originalName: att.original_name || att.original_file_name || 'Attachment',
                        mimeType: att.mime_type || 'application/octet-stream',
                        sizeBytes: att.size_bytes || att.file_size_bytes || 0,
                        kind: (att.attachment_kind as ChatAttachmentItem['kind']) || (att.mime_type?.startsWith('image/')
                          ? 'image'
                          : att.mime_type?.startsWith('video/')
                          ? 'video'
                          : att.mime_type?.startsWith('audio/')
                          ? 'audio'
                          : 'document'),
                      };
                    })
                  );
                  setMessages((prev) =>
                    prev.map((m) => (m.id === newMsg.id ? { ...m, attachments: resolved } : m))
                  );
                }
              } catch (e) {
                console.warn('Error resolving realtime attachments:', e);
              }
            })();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
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
                  reactions: updated.structured_payload?.reactions || m.reactions,
                };
              }
              return m;
            })
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updatedPart = payload.new;
          if (updatedPart && updatedPart.user_id !== currentUser.id && updatedPart.last_read_at) {
            const readTime = new Date(updatedPart.last_read_at).getTime();
            setMessages((prev) =>
              prev.map((m) => {
                if (m.senderUserId === currentUser.id) {
                  const msgTime = new Date(m.sentAt).getTime();
                  if (readTime >= msgTime) {
                    return { ...m, status: 'read' };
                  }
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
            const deltaMsgs = await SyncCoordinator.executeDeltaSync(supabase, conversationId, currentUser?.id);
            if (deltaMsgs && deltaMsgs.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const filteredNew = deltaMsgs.filter((m) => !existingIds.has(m.id));
                return [...filteredNew, ...prev];
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
  }, [conversationId, currentUser, partnerName, clearPartnerTyping, flushPendingQueue]);

  // Send text message
  const handleSendMessage = useCallback(async () => {
    if (!composerText.trim() || !conversationId || !currentUser) return;
    const text = composerText.trim();
    const replySnapshot = replyingToMessage;

    sendTyping(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComposerText('');
    setReplyingToMessage(null);

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderType: 'user',
      senderUserId: currentUser.id,
      authorName: 'You',
      authorRoleLabel: 'You',
      status: 'sending',
      messageKind: 'text',
      body: text,
      sentAt: new Date().toISOString(),
      intent: 'general',
      structuredPayload: replySnapshot ? {
        replyTo: {
          messageId: replySnapshot.id,
          authorName: replySnapshot.authorName,
          body: replySnapshot.body,
        },
      } : {},
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
      }
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      const isRateLimited = errMsg.includes('rate_limit') || err.code === 'P0001';

      if (isRateLimited) {
        console.warn('[Rate Limit Exceeded] Cooldown engaged, preserving in pending queue');
        setRateLimitCooldown(true);
        setTimeout(() => setRateLimitCooldown(false), 4000);

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m))
        );
        await addPendingMessage(conversationId, {
          id: tempId,
          body: text,
          senderUserId: currentUser.id,
          createdAt: optimisticMsg.sentAt,
          messageKind: 'text',
          isPending: true,
        });
        await OfflineEngine.enqueueOutbox({
          id: tempId,
          conversationId,
          senderUserId: currentUser.id,
          messageKind: 'text',
          body: text,
          intent: 'general',
          structuredPayload: replySnapshot ? {
            replyTo: {
              messageId: replySnapshot.id,
              authorName: replySnapshot.authorName,
              body: replySnapshot.body,
            },
          } : {},
          createdAt: optimisticMsg.sentAt,
          retryCount: 0,
          error: 'Rate limit exceeded',
        });

        setTimeout(async () => {
          await retryPendingMessage(tempId, text, replySnapshot);
        }, 3500);
      } else {
        console.warn('[Send Failed] Preserving in offline queue:', err);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m))
        );
        await addPendingMessage(conversationId, {
          id: tempId,
          body: text,
          senderUserId: currentUser.id,
          createdAt: optimisticMsg.sentAt,
          messageKind: 'text',
          isPending: true,
        });
        await OfflineEngine.enqueueOutbox({
          id: tempId,
          conversationId,
          senderUserId: currentUser.id,
          messageKind: 'text',
          body: text,
          intent: 'general',
          structuredPayload: replySnapshot ? {
            replyTo: {
              messageId: replySnapshot.id,
              authorName: replySnapshot.authorName,
              body: replySnapshot.body,
            },
          } : {},
          createdAt: optimisticMsg.sentAt,
          retryCount: 0,
          error: err?.message,
        });
      }
    }
  }, [composerText, conversationId, currentUser, replyingToMessage, sendTyping, ensureParticipantAuthorization, retryPendingMessage]);

  // Send property catalog listing
  const handleSendCatalogListing = useCallback(async (listing: SelectedListing) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendListingMessage({
        conversationId,
        senderUserId: currentUser.id,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          location: listing.location,
          imageUrl: listing.imageUrl || undefined,
          referenceCode: listing.referenceCode || undefined,
          listingStatus: listing.listingStatus,
        },
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Catalog Error', e.message);
    }
  }, [conversationId, currentUser, ensureParticipantAuthorization, fetchMessages]);

  // Send inquiry form questionnaire
  const handleSendInquiryTemplate = useCallback(async (tmpl: SelectedInquiryTemplate) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendInquiryTemplate({
        conversationId,
        senderUserId: currentUser.id,
        templateId: tmpl.templateId,
        templateTitle: tmpl.templateTitle,
        fields: tmpl.fields.map((f, idx) => ({
          id: f.id || f.fieldName || `field_${idx}`,
          fieldName: f.fieldName,
          fieldLabel: f.fieldLabel,
          fieldType: f.fieldType,
          isRequired: Boolean(f.isRequired),
          options: f.options,
        })),
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Inquiry Form Error', e.message);
    }
  }, [conversationId, currentUser, ensureParticipantAuthorization, fetchMessages]);

  // Send embed URL
  const handleSendEmbed = useCallback(async (embedUrl: string) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendEmbedMessage({
        conversationId,
        senderUserId: currentUser.id,
        embedUrl,
        title: '3D Virtual Tour',
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Embed Error', e.message);
    }
  }, [conversationId, currentUser, ensureParticipantAuthorization, fetchMessages]);

  // Send inquiry form questionnaire answers
  const handleSendInquiryResponse = useCallback(async (answers: Record<string, any>) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendInquiryResponse({
        conversationId,
        senderUserId: currentUser.id,
        answers,
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Inquiry Response Error', e.message);
    }
  }, [conversationId, currentUser, ensureParticipantAuthorization, fetchMessages]);

  // Reactions
  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      const currentReactions: Record<string, string[]> = { ...(msg.reactions || {}) };
      const usersForEmoji = currentReactions[emoji] || [];

      if (usersForEmoji.includes(currentUser.id)) {
        currentReactions[emoji] = usersForEmoji.filter((uid) => uid !== currentUser.id);
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      } else {
        currentReactions[emoji] = [...usersForEmoji, currentUser.id];
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: currentReactions } : m))
      );

      const updatedReactions = await messageRepository.toggleMessageReaction(messageId, emoji);
      if (updatedReactions) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
        );
      }
    } catch (e) {
      console.warn('Failed to update reaction via RPC', e);
      fetchMessages();
    }
  }, [currentUser, messages, fetchMessages]);

  // Star / unstar message
  const handleToggleStar = useCallback(async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isCurrentlyStarred = starredMsgIds.has(messageId);

      setStarredMsgIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyStarred) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        return next;
      });

      await messageRepository.toggleMessageStar(messageId);
    } catch (e: any) {
      console.warn('Failed to toggle star via RPC', e);
    }
  }, [starredMsgIds]);

  // Delete message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await messageRepository.deleteMessage(messageId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, []);

  return {
    messages,
    setMessages,
    loadingMessages,
    hasMoreMessages,
    loadingMore,
    rateLimitCooldown,
    composerText,
    setComposerText,
    replyingToMessage,
    setReplyingToMessage,
    starredMsgIds,
    fetchMessages,
    loadMoreMessages,
    handleSendMessage,
    handleSendCatalogListing,
    handleSendInquiryTemplate,
    handleSendInquiryResponse,
    handleSendEmbed,
    handleReactToMessage,
    handleToggleStar,
    handleDeleteMessage,
    addOptimisticMessage,
    updateOptimisticMessage,
    removeOptimisticMessage,
  };
}
