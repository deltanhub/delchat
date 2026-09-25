import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { conversationRepository } from '../../../lib/repositories';
import type { MuteDuration } from '../../../lib/repositories/conversationRepository';
import { ChatConversation } from '../../../components/chat/ConversationRow';

export interface UseConversationMutationActionsParams {
  currentUser: any;
  conversations: ChatConversation[];
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  fetchConversations: () => Promise<void>;
  sortConversations: (list: ChatConversation[]) => ChatConversation[];
  setMuteTargetId: (id: string | null) => void;
  setMuteModalVisible: (visible: boolean) => void;
  muteTargetId: string | null;
}

export function useConversationMutationActions({
  currentUser,
  conversations,
  setConversations,
  fetchConversations,
  sortConversations,
  setMuteTargetId,
  setMuteModalVisible,
  muteTargetId,
}: UseConversationMutationActionsParams) {
  const handleToggleArchive = useCallback(async (conversationId: string, currentArchived: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: !currentArchived } : c))
      );
      await conversationRepository.toggleConversationArchive(conversationId, currentUser?.id, !currentArchived);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [currentUser, setConversations]);

  const handleToggleMute = useCallback(async (conversationId: string, currentMuted: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMuted) {
      try {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isMuted: false } : c))
        );
        await conversationRepository.toggleConversationMute(conversationId, currentUser?.id, false);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    } else {
      setMuteTargetId(conversationId);
      setMuteModalVisible(true);
    }
  }, [currentUser, setConversations, setMuteTargetId, setMuteModalVisible]);

  const handleInboxMuteWithDuration = useCallback(async (duration: MuteDuration) => {
    setMuteModalVisible(false);
    if (!muteTargetId || !currentUser) return;
    if (duration === 'unmute') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === muteTargetId ? { ...c, isMuted: true } : c))
      );
      await conversationRepository.toggleConversationMute(muteTargetId, currentUser.id, true, duration);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setMuteTargetId(null);
  }, [currentUser, muteTargetId, setConversations, setMuteTargetId, setMuteModalVisible]);

  const handleMarkReadToggle = useCallback(async (conversationId: string, currentUnread: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: currentUnread ? 0 : 1 } : c))
      );
      if (currentUnread) {
        await conversationRepository.markConversationRead(conversationId);
      } else {
        await conversationRepository.markConversationUnread(conversationId, currentUser?.id);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [currentUser, setConversations]);

  const handleTogglePin = useCallback(async (conversationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const target = conversations.find((c) => c.id === conversationId);
      const willPin = !target?.isPinned;
      const currentlyPinnedCount = conversations.filter((c) => c.isPinned).length;
      if (willPin && currentlyPinnedCount >= 5) {
        Alert.alert('Pin Limit Reached', 'You can pin up to 5 conversations to the top of your inbox.');
        return;
      }
      setConversations((prev) =>
        sortConversations(
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, isPinned: willPin, pinnedAt: willPin ? new Date().toISOString() : null }
              : c
          )
        )
      );
      await conversationRepository.toggleConversationPinned(conversationId, willPin);
    } catch (e: any) {
      Alert.alert('Pin Error', e.message || 'Unable to update pin status.');
      fetchConversations();
    }
  }, [conversations, fetchConversations, setConversations, sortConversations]);

  return {
    handleToggleArchive,
    handleToggleMute,
    handleInboxMuteWithDuration,
    handleMarkReadToggle,
    handleTogglePin,
  };
}
