import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../../../components/chat/bubbles/types';
import OfflineEngine from '../../../lib/offline-engine';
import { getCachedMessages } from '../../../lib/cache-manager';

export function useMessagesState(conversationId: string, currentUser: any, partnerName?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    OfflineEngine.getMessagesSync(conversationId)
  );
  const [loadingMessages, setLoadingMessages] = useState<boolean>(() => {
    const cached = OfflineEngine.getMessagesSync(conversationId);
    return cached.length === 0;
  });
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [starredMsgIds, setStarredMsgIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (currentUser && conversationId) {
      OfflineEngine.getMessages(conversationId).then((richCached) => {
        if (richCached && richCached.length > 0) {
          setMessages((prev) => (prev.length === 0 ? richCached : prev));
          setLoadingMessages(false);
        } else {
          getCachedMessages(conversationId).then((cached) => {
            if (cached && cached.length > 0) {
              setMessages((prev) => {
                if (prev.length > 0) return prev;
                return cached.map((c) => ({
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
                }));
              });
              setLoadingMessages(false);
            }
          });
        }
      });
    }
  }, [currentUser, conversationId, partnerName]);

  return {
    messages,
    setMessages,
    loadingMessages,
    setLoadingMessages,
    hasMoreMessages,
    setHasMoreMessages,
    loadingMore,
    setLoadingMore,
    rateLimitCooldown,
    setRateLimitCooldown,
    composerText,
    setComposerText,
    replyingToMessage,
    setReplyingToMessage,
    starredMsgIds,
    setStarredMsgIds,
    addOptimisticMessage,
    updateOptimisticMessage,
    removeOptimisticMessage,
  };
}
