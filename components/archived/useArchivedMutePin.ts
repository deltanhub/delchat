import React, { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../lib/haptics';
import { conversationRepository } from '../../lib/repositories';
import { ChatConversation } from '../chat/ConversationRow';
import type { MuteDuration } from '../../lib/repositories/conversationRepository';

interface UseArchivedMutePinProps {
  conversations: ChatConversation[];
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  currentUser: any;
  fetchConversations: () => void;
}

export function useArchivedMutePin({
  conversations,
  setConversations,
  currentUser,
  fetchConversations,
}: UseArchivedMutePinProps) {
  const [muteTargetId, setMuteTargetId] = useState<string | null>(null);
  const [muteModalVisible, setMuteModalVisible] = useState(false);

  const closeMuteModal = () => {
    setMuteModalVisible(false);
    setMuteTargetId(null);
  };

  const handleToggleMute = async (conversationId: string, currentMuted: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMuted) {
      try {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isMuted: false } : c))
        );
        if (currentUser?.id) {
          await conversationRepository.toggleConversationMute(conversationId, currentUser.id, false);
        }
      } catch (e: any) {
        Alert.alert('Mute Error', e?.message || 'Unable to update mute status.');
        fetchConversations();
      }
    } else {
      setMuteTargetId(conversationId);
      setMuteModalVisible(true);
    }
  };

  const handleArchivedMuteWithDuration = async (duration: MuteDuration) => {
    setMuteModalVisible(false);
    if (!muteTargetId || !currentUser?.id) return;
    if (duration === 'unmute') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === muteTargetId ? { ...c, isMuted: true } : c))
      );
      await conversationRepository.toggleConversationMute(muteTargetId, currentUser.id, true, duration);
    } catch (e: any) {
      Alert.alert('Mute Error', e?.message || 'Unable to update mute status.');
      fetchConversations();
    }
    setMuteTargetId(null);
  };

  const handleTogglePin = async (conversationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const target = conversations.find((c) => c.id === conversationId);
      const willPin = !target?.isPinned;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, isPinned: willPin, pinnedAt: willPin ? new Date().toISOString() : null }
            : c
        )
      );
      await conversationRepository.toggleConversationPinned(conversationId, willPin);
    } catch (e: any) {
      Alert.alert('Pin Error', e?.message || 'Unable to update pin status.');
    }
  };

  const handleToggleFavorite = async (conversationId: string, currentFavorited: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const willFavorite = !currentFavorited;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, isFavorited: willFavorite, favoritedAt: willFavorite ? new Date().toISOString() : null }
            : c
        )
      );
      await conversationRepository.toggleConversationFavorite(conversationId, willFavorite);
    } catch (e: any) {
      Alert.alert('Favourites Error', e?.message || 'Unable to update favourite status.');
      fetchConversations();
    }
  };

  return {
    muteModalVisible,
    closeMuteModal,
    handleToggleMute,
    handleArchivedMuteWithDuration,
    handleTogglePin,
    handleToggleFavorite,
  };
}
