import { useCallback } from 'react';
import { Share, Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import type { ChatMessage } from '../MessageBubble';

let ExpoClipboard: any = null;
try {
  ExpoClipboard = require('expo-clipboard');
} catch {}

interface UseMessageActionHandlersOptions {
  message: ChatMessage | null;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onStarToggle?: (messageId: string) => void;
  onAskAI?: (message: ChatMessage) => void;
  onInfo?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
}

export function useMessageActionHandlers({
  message,
  onClose,
  onReact,
  onReply,
  onStarToggle,
  onAskAI,
  onInfo,
  onDelete,
}: UseMessageActionHandlersOptions) {
  const handleEmojiSelect = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(emoji);
    onClose();
  }, [onReact, onClose]);

  const handleCopy = useCallback(async () => {
    if (!message) return;
    const textToCopy = message.body || message.attachments?.[0]?.url || '';
    if (textToCopy) {
      if (ExpoClipboard && typeof ExpoClipboard.setStringAsync === 'function') {
        try {
          await ExpoClipboard.setStringAsync(textToCopy);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Copied', 'Message copied to clipboard.');
        } catch {
          await Share.share({ message: textToCopy });
        }
      } else {
        await Share.share({ message: textToCopy });
      }
    }
    onClose();
  }, [message, onClose]);

  const handleForward = useCallback(async () => {
    if (!message) return;
    onClose();
    const shareContent = message.body || (message.attachments?.[0]?.url ?? 'Shared from DeltanHub');
    try {
      await Share.share({
        message: shareContent,
        title: 'Share message',
      });
    } catch {}
  }, [message, onClose]);

  const handleReplyPress = useCallback(() => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onReply(message);
  }, [message, onClose, onReply]);

  const handleStarPress = useCallback(() => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onStarToggle?.(message.id);
  }, [message, onClose, onStarToggle]);

  const handleAskAIPress = useCallback(() => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onAskAI?.(message);
  }, [message, onClose, onAskAI]);

  const handleInfoPress = useCallback(() => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onInfo?.(message);
  }, [message, onClose, onInfo]);

  const handleDeletePress = useCallback(() => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(message.id),
        },
      ]
    );
  }, [message, onClose, onDelete]);

  return {
    handleEmojiSelect,
    handleCopy,
    handleForward,
    handleReplyPress,
    handleStarPress,
    handleAskAIPress,
    handleInfoPress,
    handleDeletePress,
  };
}
