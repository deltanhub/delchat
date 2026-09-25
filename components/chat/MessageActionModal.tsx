import React from 'react';
import { View, Pressable, Modal } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import {
  QuickReactionPill,
  ElevatedMessagePreview,
  MessageActionMenuList,
  useMessageActionHandlers,
  styles,
  QUICK_EMOJIS,
} from './message_actions';
import type { MessageActionModalProps } from './message_actions/types';

export type { MessageActionModalProps };

export default function MessageActionModal({
  visible,
  message,
  isCurrentUser,
  isStarred = false,
  onClose,
  onReact,
  onReply,
  onStarToggle,
  onAskAI,
  onInfo,
  onDelete,
}: MessageActionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    handleEmojiSelect,
    handleCopy,
    handleForward,
    handleReplyPress,
    handleStarPress,
    handleAskAIPress,
    handleInfoPress,
    handleDeletePress,
  } = useMessageActionHandlers({
    message,
    onClose,
    onReact,
    onReply,
    onStarToggle,
    onAskAI,
    onInfo,
    onDelete,
  });

  if (!visible || !message) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.contentContainer}>
          {/* Quick Reaction Pill */}
          <QuickReactionPill
            emojis={QUICK_EMOJIS}
            isCurrentUser={isCurrentUser}
            isDark={isDark}
            onSelectEmoji={handleEmojiSelect}
          />

          {/* Focused Elevating Message Preview */}
          <ElevatedMessagePreview
            message={message}
            isCurrentUser={isCurrentUser}
            isDark={isDark}
          />

          {/* Contextual Action Menu List (WhatsApp / iOS Style) */}
          <MessageActionMenuList
            message={message}
            isCurrentUser={isCurrentUser}
            isStarred={isStarred}
            isDark={isDark}
            onReply={handleReplyPress}
            onCopy={handleCopy}
            onForward={handleForward}
            onStarToggle={handleStarPress}
            onAskAI={handleAskAIPress}
            onInfo={handleInfoPress}
            onDelete={handleDeletePress}
          />
        </View>
      </Pressable>
    </Modal>
  );
}
