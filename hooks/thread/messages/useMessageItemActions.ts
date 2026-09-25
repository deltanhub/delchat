import { useCallback } from 'react';
import { Alert } from 'react-native';
import { messageRepository } from '../../../lib/repositories/messageRepository';
import * as Haptics from '../../../lib/haptics';
import type { ChatMessage } from '../../../components/chat/bubbles/types';

export function useMessageItemActions(
  currentUser: any,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  starredMsgIds: Set<string>,
  setStarredMsgIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  fetchMessages: () => Promise<void>
) {
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
  }, [currentUser, messages, setMessages, fetchMessages]);

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
  }, [starredMsgIds, setStarredMsgIds]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await messageRepository.deleteMessage(messageId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [setMessages]);

  return {
    handleReactToMessage,
    handleToggleStar,
    handleDeleteMessage,
  };
}
