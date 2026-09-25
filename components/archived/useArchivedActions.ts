import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '../../lib/haptics';
import { conversationRepository } from '../../lib/repositories';
import { ChatConversation } from '../chat/ConversationRow';
import { useArchivedMutePin } from './useArchivedMutePin';
import {
  promptDeleteConversation,
  promptClearConversation,
  promptBlockUser,
} from './archivedDialogs';

interface UseArchivedActionsProps {
  conversations: ChatConversation[];
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  currentUser: any;
  fetchConversations: () => void;
}

export function useArchivedActions({
  conversations,
  setConversations,
  currentUser,
  fetchConversations,
}: UseArchivedActionsProps) {
  const router = useRouter();
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionModalConv, setActionModalConv] = useState<ChatConversation | null>(null);

  const mutePin = useArchivedMutePin({
    conversations,
    setConversations,
    currentUser,
    fetchConversations,
  });

  const openActionModal = (conv: ChatConversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionModalConv(conv);
    setActionModalVisible(true);
  };

  const closeActionModal = () => setActionModalVisible(false);

  const handleOpenConversation = (conversationId: string) => {
    const target = conversations.find((c) => c.id === conversationId);
    router.push({
      pathname: '/thread/[id]',
      params: {
        id: conversationId,
        partnerName: target?.partnerName || 'Chat',
        title: target?.title || '',
        partnerSubtitle: target?.partnerSubtitle || target?.listing?.title || '',
        listingId: target?.listing?.id || '',
      },
    });
  };

  const handleToggleArchive = async (conversationId: string, currentArchived: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const willArchive = !currentArchived;
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: willArchive } : c))
      );
      if (currentUser?.id) {
        await conversationRepository.toggleConversationArchive(conversationId, currentUser.id, willArchive);
      }
    } catch (e: any) {
      Alert.alert('Archive Error', e?.message || 'Unable to update archive status.');
      fetchConversations();
    }
  };

  const handleMarkReadToggle = async (conversationId: string, currentUnread: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: currentUnread ? 0 : 1 } : c))
      );
      if (currentUnread) {
        await conversationRepository.markConversationRead(conversationId);
      } else if (currentUser?.id) {
        await conversationRepository.markConversationUnread(conversationId, currentUser.id);
      }
    } catch (e: any) {
      Alert.alert('Read Receipt Error', e?.message || 'Unable to update status.');
    }
  };

  return {
    actionModalVisible,
    actionModalConv,
    openActionModal,
    closeActionModal,
    muteModalVisible: mutePin.muteModalVisible,
    closeMuteModal: mutePin.closeMuteModal,
    handleOpenConversation,
    handleToggleArchive,
    handleToggleMute: mutePin.handleToggleMute,
    handleArchivedMuteWithDuration: mutePin.handleArchivedMuteWithDuration,
    handleMarkReadToggle,
    handleTogglePin: mutePin.handleTogglePin,
    handleDeleteConversation: (id: string) => promptDeleteConversation(id, currentUser?.id, setConversations),
    handleToggleFavorite: mutePin.handleToggleFavorite,
    handleClearConversation: (id: string) => promptClearConversation(id, currentUser?.id, setConversations),
    handleBlockUser: (conv: ChatConversation) => promptBlockUser(conv, setConversations),
  };
}

export default useArchivedActions;
