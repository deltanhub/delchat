import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { conversationRepository } from '../../../lib/repositories';
import type { MuteDuration } from '../../../lib/repositories/conversationRepository';
import * as Haptics from '../../../lib/haptics';
import type { ChatConversation } from '../../../components/chat/ConversationRow';

export function useSessionHeaderActions(
  conversationId: string,
  currentUser: any,
  conversation: ChatConversation | null,
  setConversation: React.Dispatch<React.SetStateAction<ChatConversation | null>>,
  showToast: (msg: string) => void
) {
  const [isMuteModalVisible, setIsMuteModalVisible] = useState(false);
  const openMuteModal = useCallback(() => setIsMuteModalVisible(true), []);
  const closeMuteModal = useCallback(() => setIsMuteModalVisible(false), []);

  const handleToggleArchive = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const willArchive = !Boolean(conversation?.isArchived);
    setConversation((prev: any) => (prev ? { ...prev, isArchived: willArchive } : prev));
    showToast(willArchive ? 'Chat archived' : 'Chat unarchived');

    try {
      await conversationRepository.toggleConversationArchive(conversationId, currentUser.id, willArchive);
    } catch {
      setConversation((prev: any) => (prev ? { ...prev, isArchived: !willArchive } : prev));
      showToast('Unable to update archive state');
    }
  }, [currentUser, conversationId, conversation?.isArchived, setConversation, showToast]);

  const handleMuteWithDuration = useCallback(async (duration: MuteDuration) => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuteModalVisible(false);

    if (duration === 'unmute') {
      setConversation((prev: any) => (prev ? { ...prev, isMuted: false } : prev));
      showToast('Notifications unmuted');
      try {
        await conversationRepository.toggleConversationMute(conversationId, currentUser.id, false);
      } catch {
        setConversation((prev: any) => (prev ? { ...prev, isMuted: true } : prev));
        showToast('Unable to update mute state');
      }
    } else {
      setConversation((prev: any) => (prev ? { ...prev, isMuted: true } : prev));
      const toastMap: Record<string, string> = {
        '8h': 'Notifications muted for 8 hours',
        '1w': 'Notifications muted for 1 week',
        always: 'Notifications muted',
      };
      showToast(toastMap[duration] || 'Notifications muted');
      try {
        await conversationRepository.toggleConversationMute(conversationId, currentUser.id, true, duration);
      } catch {
        setConversation((prev: any) => (prev ? { ...prev, isMuted: false } : prev));
        showToast('Unable to update mute state');
      }
    }
  }, [currentUser, conversationId, setConversation, showToast]);

  const handleToggleMute = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Boolean(conversation?.isMuted)) {
      handleMuteWithDuration('unmute');
    } else {
      openMuteModal();
    }
  }, [currentUser, conversationId, conversation?.isMuted, handleMuteWithDuration, openMuteModal]);

  const handleToggleBlock = useCallback(async () => {
    if (!currentUser) return;
    const partnerId = conversation?.partnerUserId;
    if (!partnerId) return;

    const isCurrentlyBlocked = Boolean(conversation?.isBlocked);

    if (isCurrentlyBlocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversation((prev: any) => (prev ? { ...prev, isBlocked: false, blockedByMe: false } : prev));
      showToast('Contact unblocked');
      try {
        await conversationRepository.toggleChatUserBlock(partnerId);
      } catch {
        setConversation((prev: any) => (prev ? { ...prev, isBlocked: true, blockedByMe: true } : prev));
        showToast('Unable to unblock contact');
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Block Contact',
        `Block ${conversation?.partnerName || 'this contact'} from messaging or calling you in chat?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block Contact',
            style: 'destructive',
            onPress: async () => {
              setConversation((prev: any) => (prev ? { ...prev, isBlocked: true, blockedByMe: true } : prev));
              showToast('Contact blocked in chat');
              try {
                await conversationRepository.toggleChatUserBlock(partnerId);
              } catch {
                setConversation((prev: any) => (prev ? { ...prev, isBlocked: false, blockedByMe: false } : prev));
                showToast('Unable to block contact');
              }
            },
          },
        ]
      );
    }
  }, [currentUser, conversation?.partnerUserId, conversation?.partnerName, conversation?.isBlocked, setConversation, showToast]);

  return {
    handleToggleArchive,
    handleToggleMute,
    isMuteModalVisible,
    openMuteModal,
    closeMuteModal,
    handleMuteWithDuration,
    handleToggleBlock,
  };
}
