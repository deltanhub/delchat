import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { supabase } from '../../../lib/supabase';
import { conversationRepository } from '../../../lib/repositories';
import { ChatConversation } from '../../../components/chat/ConversationRow';

export interface UseConversationSafetyActionsParams {
  currentUser: any;
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  fetchConversations: () => Promise<void>;
}

export function useConversationSafetyActions({
  currentUser,
  setConversations,
  fetchConversations,
}: UseConversationSafetyActionsParams) {
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    Alert.alert('Delete Conversation', 'Are you sure you want to remove this chat from your inbox?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setConversations((prev) => prev.filter((c) => c.id !== conversationId));
          await supabase
            .from('chat_participants')
            .update({ removed_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', currentUser?.id);
        },
      },
    ]);
  }, [currentUser, setConversations]);

  const handleToggleFavorite = useCallback(async (conversationId: string, currentFavorited: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const willFavorite = !currentFavorited;
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isFavorited: willFavorite, favoritedAt: willFavorite ? new Date().toISOString() : null } : c))
      );
      await conversationRepository.toggleConversationFavorite(conversationId, willFavorite);
    } catch (e: any) {
      Alert.alert('Favourites Error', e.message || 'Unable to update favourite status.');
      fetchConversations();
    }
  }, [fetchConversations, setConversations]);

  const handleClearConversation = useCallback(async (conversationId: string) => {
    Alert.alert('Clear Chat Messages', 'Are you sure you want to clear all messages in this chat for your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Chat',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const res = await conversationRepository.clearConversationHistory(conversationId, currentUser?.id);
            setConversations((prev) =>
              prev.map((c) => (c.id === conversationId ? { ...c, preview: 'No messages yet', unreadCount: 0, clearedHistoryAt: res.clearedHistoryAt } : c))
            );
          } catch (e: any) {
            Alert.alert('Clear Chat Error', e.message || 'Unable to clear conversation history.');
          }
        },
      },
    ]);
  }, [currentUser, setConversations]);

  const handleBlockUser = useCallback(async (conversation: ChatConversation) => {
    const partnerId = conversation.partnerUserId;
    if (!partnerId) {
      Alert.alert('Error', 'Unable to resolve contact to block.');
      return;
    }
    const isCurrentlyBlocked = Boolean(conversation.isBlocked);
    Alert.alert(
      isCurrentlyBlocked ? 'Unblock Contact' : 'Block Contact',
      isCurrentlyBlocked ? `Are you sure you want to unblock ${conversation.partnerName}?` : `Are you sure you want to block ${conversation.partnerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyBlocked ? 'Unblock' : 'Block',
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const blocked = await conversationRepository.toggleChatUserBlock(partnerId);
              setConversations((prev) =>
                prev.map((c) => (c.partnerUserId === partnerId ? { ...c, isBlocked: blocked, blockedByMe: blocked } : c))
              );
            } catch (e: any) {
              Alert.alert('Block Error', e.message || 'Unable to update contact block state.');
            }
          },
        },
      ]
    );
  }, [setConversations]);

  return {
    handleDeleteConversation,
    handleToggleFavorite,
    handleClearConversation,
    handleBlockUser,
  };
}
