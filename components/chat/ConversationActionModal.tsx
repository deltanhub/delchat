import React from 'react';
import { Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from '../../lib/haptics';
import {
  styles,
  ConversationActionModalProps,
  useConversationPeekMessages,
  ConversationPeekCard,
  ConversationContextMenu,
} from './actions';

export default function ConversationActionModal({
  visible,
  conversation,
  currentUserId,
  onClose,
  onOpenConversation,
  onToggleArchive,
  onToggleMute,
  onMarkReadToggle,
  onDeleteConversation,
  onClearConversation,
  onBlockUser,
  onTogglePin,
  onToggleFavorite,
}: ConversationActionModalProps) {
  const { recentMessages, loading } = useConversationPeekMessages(visible, conversation);

  if (!visible || !conversation) return null;

  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onOpenConversation) {
      onOpenConversation(conversation.id);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.modalContainer}
        >
          {/* 1. TOP PEEK PREVIEW CARD */}
          <ConversationPeekCard
            conversation={conversation}
            recentMessages={recentMessages}
            loading={loading}
            currentUserId={currentUserId}
            onOpenChat={handleOpenChat}
          />

          {/* 2. BOTTOM FLOATING CONTEXT MENU */}
          <ConversationContextMenu
            conversation={conversation}
            onClose={onClose}
            onToggleArchive={onToggleArchive}
            onToggleMute={onToggleMute}
            onMarkReadToggle={onMarkReadToggle}
            onDeleteConversation={onDeleteConversation}
            onClearConversation={onClearConversation}
            onBlockUser={onBlockUser}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
          />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export { ConversationActionModalProps };
