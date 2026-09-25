import React from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../lib/haptics';
import { conversationRepository } from '../../lib/repositories';
import { supabase } from '../../lib/supabase';
import { ChatConversation } from '../chat/ConversationRow';

export function promptDeleteConversation(
  conversationId: string,
  currentUserId: string | undefined,
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>
) {
  Alert.alert(
    'Delete Conversation',
    'Are you sure you want to remove this chat from your archived chats?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setConversations((prev) => prev.filter((c) => c.id !== conversationId));
          if (currentUserId) {
            await supabase
              .from('chat_participants')
              .update({ removed_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUserId);
          }
        },
      },
    ]
  );
}

export function promptClearConversation(
  conversationId: string,
  currentUserId: string | undefined,
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>
) {
  Alert.alert(
    'Clear Chat Messages',
    'Are you sure you want to clear all messages in this chat? Your chat history will be cleared.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Chat',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const res = await conversationRepository.clearConversationHistory(conversationId, currentUserId);
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      preview: 'No messages yet',
                      unreadCount: 0,
                      clearedHistoryAt: res.clearedHistoryAt,
                    }
                  : c
              )
            );
          } catch (e: any) {
            Alert.alert('Clear Chat Error', e?.message || 'Unable to clear conversation history.');
          }
        },
      },
    ]
  );
}

export function promptBlockUser(
  conversation: ChatConversation,
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>
) {
  const partnerId = conversation.partnerUserId;
  if (!partnerId) {
    Alert.alert('Error', 'Unable to resolve contact to block.');
    return;
  }
  const isCurrentlyBlocked = Boolean(conversation.isBlocked);
  Alert.alert(
    isCurrentlyBlocked ? 'Unblock Contact' : 'Block Contact',
    isCurrentlyBlocked
      ? `Are you sure you want to unblock ${conversation.partnerName}?`
      : `Are you sure you want to block ${conversation.partnerName}? They will not be able to message or call you.`,
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
              prev.map((c) =>
                c.partnerUserId === partnerId
                  ? { ...c, isBlocked: blocked, blockedByMe: blocked }
                  : c
              )
            );
          } catch (e: any) {
            Alert.alert('Block Error', e?.message || 'Unable to update contact block state.');
          }
        },
      },
    ]
  );
}
