import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TouchableOpacity,
  Share,
  Dimensions,
  Alert,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { Ionicons } from '@expo/vector-icons';

// Safe dynamic clipboard fallback
let ExpoClipboard: any = null;
try {
  ExpoClipboard = require('expo-clipboard');
} catch {}
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import type { ChatMessage } from './MessageBubble';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageActionModalProps {
  visible: boolean;
  message: ChatMessage | null;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onStarToggle?: (messageId: string) => void;
  onAskAI?: (message: ChatMessage) => void;
  onInfo?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
}

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
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  if (!visible || !message) return null;

  const handleEmojiSelect = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(emoji);
    onClose();
  };

  const handleCopy = async () => {
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
  };

  const handleForward = async () => {
    onClose();
    const shareContent = message.body || (message.attachments?.[0]?.url ?? 'Shared from DeltanHub');
    try {
      await Share.share({
        message: shareContent,
        title: 'Share message',
      });
    } catch {}
  };

  const handleReplyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onReply(message);
  };

  const handleStarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onStarToggle?.(message.id);
  };

  const handleAskAIPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onAskAI?.(message);
  };

  const handleInfoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onInfo?.(message);
  };

  const handleDeletePress = () => {
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
  };

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
          <View
            style={[
              styles.reactionPill,
              {
                backgroundColor: isDark ? '#1f1f23' : '#ffffff',
                borderColor: isDark ? '#333338' : '#e2e8f0',
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.7}
                onPress={() => handleEmojiSelect(emoji)}
                style={styles.emojiBtn}
              >
                <Text style={styles.emojiChar}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Focused Elevating Message Preview */}
          <View
            style={[
              styles.messagePreviewBubble,
              {
                backgroundColor: isCurrentUser ? colors.primary : (isDark ? '#232326' : '#ffffff'),
                borderColor: isCurrentUser ? 'rgba(255,255,255,0.1)' : colors.border,
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            {!isCurrentUser && (
              <Text style={[styles.previewAuthorName, { color: isDark ? '#ffffff' : colors.primary }]}>
                {message.authorName}
              </Text>
            )}

            {message.body ? (
              <Text
                style={[
                  styles.previewBodyText,
                  { color: isCurrentUser ? '#ffffff' : colors.text },
                ]}
                numberOfLines={6}
              >
                {message.body}
              </Text>
            ) : null}

            {message.attachments && message.attachments.length > 0 && (
              <View style={styles.attachmentBadge}>
                <Ionicons
                  name={message.attachments[0].kind === 'document' ? 'document-text' : 'image'}
                  size={14}
                  color={isCurrentUser ? '#ffffff' : colors.placeholder}
                />
                <Text
                  style={[
                    styles.attachmentBadgeText,
                    { color: isCurrentUser ? 'rgba(255,255,255,0.85)' : colors.placeholder },
                  ]}
                  numberOfLines={1}
                >
                  {message.attachments[0].originalName || `${message.attachments.length} attachment(s)`}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.previewTimeText,
                { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.placeholder },
              ]}
            >
              {message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>

          {/* Contextual Action Menu List (WhatsApp / iOS Style) */}
          <View
            style={[
              styles.actionMenuCard,
              {
                backgroundColor: isDark ? '#1f1f23' : '#ffffff',
                borderColor: isDark ? '#333338' : '#e2e8f0',
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            {/* Reply */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReplyPress}
              style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
            >
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>Reply</Text>
              <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Copy Text */}
            {message.body ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCopy}
                style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
              >
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Copy Text</Text>
                <Ionicons name="copy-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}

            {/* Forward / Share */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleForward}
              style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
            >
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>Forward</Text>
              <Ionicons name="arrow-redo-outline" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Star / Save */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleStarPress}
              style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
            >
              <Text style={[styles.menuItemLabel, { color: isStarred ? '#f59e0b' : colors.text }]}>
                {isStarred ? 'Unstar message' : 'Star message'}
              </Text>
              <Ionicons
                name={isStarred ? 'star' : 'star-outline'}
                size={20}
                color={isStarred ? '#f59e0b' : colors.text}
              />
            </TouchableOpacity>

            {/* Ask Deltan AI */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleAskAIPress}
              style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
            >
              <Text style={[styles.menuItemLabel, { color: isDark ? '#f472b6' : colors.primary }]}>
                Ask Deltan AI
              </Text>
              <Ionicons name="sparkles" size={19} color={isDark ? '#f472b6' : colors.primary} />
            </TouchableOpacity>

            {/* Message Info */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleInfoPress}
              style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
            >
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>Message Info</Text>
              <Ionicons name="information-circle-outline" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Delete (if sender or admin) */}
            {isCurrentUser && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDeletePress}
                style={[styles.menuItemRow, { borderBottomWidth: 0 }]}
              >
                <Text style={[styles.menuItemLabel, { color: '#ef4444' }]}>Delete</Text>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 12,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiChar: {
    fontSize: 24,
  },
  messagePreviewBubble: {
    maxWidth: SCREEN_WIDTH * 0.78,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  previewAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Typography.fontFamily,
  },
  previewBodyText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Typography.fontFamily,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  attachmentBadgeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  previewTimeText: {
    fontSize: 10.5,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontFamily: Typography.fontFamily,
  },
  actionMenuCard: {
    width: 230,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});
