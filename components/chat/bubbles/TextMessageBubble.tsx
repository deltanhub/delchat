import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn, LinearTransition } from 'react-native-reanimated';
import EmojiPicker, { getCountryCodeFromFlag } from '../EmojiPicker';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import {
  ChatMessage,
  ChatAttachmentItem,
  formatMsgTime,
  getStaffTag,
  detectPaymentRequest,
} from './types';

interface TextMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
  onLongPressMessage?: (message: ChatMessage) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
}

export default function TextMessageBubble({
  message,
  isCurrentUser,
  isStarred = false,
  onPressMedia,
  onLongPressMessage,
  onReactToMessage,
}: TextMessageBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const hasPaymentWarning = detectPaymentRequest(message.body);
  const replyToData = message.structuredPayload?.replyTo;
  const staffTag = getStaffTag(message);

  const handleQuickReaction = (emoji: string) => {
    onReactToMessage?.(message.id, emoji);
    setShowReactionPopover(false);
  };

  return (
    <Animated.View
      entering={
        isCurrentUser
          ? FadeInDown.duration(260).springify().damping(16).mass(0.8)
          : FadeInUp.duration(240).springify().damping(16).mass(0.8)
      }
      layout={LinearTransition.springify().damping(16)}
      style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}
    >
      <View style={{ maxWidth: '82%', alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
        {/* Reactions Popover Menu (Long-press triggered) */}
        {showReactionPopover && (
          <View
            style={[
              styles.popoverContainer,
              isCurrentUser ? styles.popoverRight : styles.popoverLeft,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleQuickReaction(emoji)}
                accessibilityLabel={`React with ${emoji}`}
                accessibilityRole="button"
                style={styles.popoverEmojiBtn}
              >
                <Text style={styles.popoverEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowFullPicker(true)}
              accessibilityLabel="Open all reaction emojis"
              accessibilityRole="button"
              accessibilityHint="Opens full emoji picker sheet"
              style={[
                styles.popoverEmojiBtn,
                styles.popoverPlusBtn,
                { backgroundColor: isDark ? '#2c2c2e' : '#f0f4f8' },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        <Pressable
          onLongPress={() => {
            if (onLongPressMessage) {
              onLongPressMessage(message);
            } else {
              setShowReactionPopover((prev) => !prev);
            }
          }}
          delayLongPress={260}
          style={({ pressed }) => [
            styles.bubbleTextContainer,
            isCurrentUser
              ? [styles.bubbleCurrent, { backgroundColor: colors.primary }]
              : [styles.bubblePartner, { backgroundColor: colors.card }],
            {
              borderColor: isCurrentUser ? colors.primary : colors.border,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}
        >
          {!isCurrentUser && (
            <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>{message.authorName}</Text>
          )}

          {staffTag && (
            <Text style={[styles.staffTagLabel, { color: isCurrentUser ? 'rgba(255, 255, 255, 0.65)' : (isDark ? '#a1a1aa' : '#7b6570') }]}>
              {staffTag}
            </Text>
          )}

          {/* WhatsApp-Style Quoted Reply Box */}
          {replyToData && (
            <View
              style={[
                styles.quotedReplyBox,
                {
                  backgroundColor: isCurrentUser ? 'rgba(0, 0, 0, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                  borderLeftColor: isCurrentUser ? '#ffffff' : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.quotedAuthor,
                  { color: isCurrentUser ? '#ffffff' : (isDark ? '#ffffff' : colors.primary) },
                ]}
                numberOfLines={1}
              >
                {replyToData.authorName || 'Member'}
              </Text>
              <Text
                style={[
                  styles.quotedBody,
                  { color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : colors.placeholder },
                ]}
                numberOfLines={2}
              >
                {replyToData.body || 'Message'}
              </Text>
            </View>
          )}

          {/* Media Attachments (Photos & Videos) */}
          {(() => {
            const mediaItems: ChatAttachmentItem[] = [
              ...(message.attachments ? message.attachments.filter((a) => a.kind === 'image' || a.kind === 'video') : []),
              ...(Array.isArray(message.structuredPayload?.attachments)
                ? message.structuredPayload.attachments
                    .filter((a: any) => a && (a.kind === 'image' || a.kind === 'video' || (!a.kind && a.url)))
                    .map((a: any, idx: number) => ({
                      id: a.id || `${message.id}-media-${idx}`,
                      url: a.url,
                      originalName: a.originalName || a.original_name || 'Media',
                      mimeType: a.mimeType || (a.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
                      sizeBytes: a.sizeBytes || a.size_bytes || 0,
                      kind: (a.kind === 'video' ? 'video' : 'image') as 'video' | 'image',
                    }))
                : []),
            ];
            const uniqueMedia = mediaItems.filter((item, index, self) =>
              index === self.findIndex((m) => (m.url && m.url === item.url) || m.id === item.id)
            );

            if (uniqueMedia.length === 0) return null;

            return (
              <View style={styles.mediaGrid}>
                {uniqueMedia.map((att) => (
                  <Pressable
                    key={att.id}
                    onPress={() => {
                      if (onPressMedia && att.url) {
                        onPressMedia(att.url, att.kind, att.originalName || message.body || 'Media');
                      } else if (att.url) {
                        Linking.openURL(att.url).catch(() => null);
                      }
                    }}
                    style={styles.mediaItemContainer}
                  >
                    <Image source={{ uri: att.url }} style={styles.mediaImage} resizeMode="cover" />
                    {att.kind === 'video' && (
                      <View style={styles.videoOverlayBadge}>
                        <Ionicons name="play-circle" size={32} color="#ffffff" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            );
          })()}

          {/* Document Attachments */}
          {(() => {
            const docItems: ChatAttachmentItem[] = [
              ...(message.attachments ? message.attachments.filter((a) => a.kind === 'document') : []),
              ...(message.structuredPayload?.document
                ? [
                    {
                      id: `${message.id}-doc`,
                      url: message.structuredPayload.document.url,
                      originalName: message.structuredPayload.document.name || 'Document',
                      mimeType: message.structuredPayload.document.mimeType || 'application/pdf',
                      sizeBytes: message.structuredPayload.document.size || 0,
                      kind: 'document' as const,
                    },
                  ]
                : []),
            ];

            const uniqueDocs = docItems.filter((doc, index, self) =>
              index === self.findIndex((d) => (d.url && d.url === doc.url) || d.originalName === doc.originalName)
            );

            if (uniqueDocs.length === 0) return null;

            return (
              <View style={styles.docsList}>
                {uniqueDocs.map((att) => {
                  const ext = (att.originalName || '').split('.').pop()?.toUpperCase() || 'DOC';
                  const isPdf = ext === 'PDF';
                  const isExcel = ['XLS', 'XLSX', 'CSV'].includes(ext);
                  const isWord = ['DOC', 'DOCX'].includes(ext);

                  const badgeColor = isPdf ? '#ef4444' : isExcel ? '#10b981' : isWord ? '#3b82f6' : '#8b5cf6';
                  const badgeBg = isDark ? 'rgba(255,255,255,0.08)' : `${badgeColor}18`;

                  const formattedSize = att.sizeBytes
                    ? att.sizeBytes > 1024 * 1024
                      ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.round(att.sizeBytes / 1024)} KB`
                    : 'Document';

                  return (
                    <Pressable
                      key={att.id}
                      onPress={() => {
                        if (att.url) {
                          Linking.openURL(att.url).catch(() => {
                            Alert.alert('Open File', 'Could not open this file automatically.');
                          });
                        }
                      }}
                      accessibilityLabel={`Document: ${att.originalName}, size ${formattedSize}`}
                      accessibilityRole="button"
                      accessibilityHint="Double tap to open or download document"
                      style={[
                        styles.docItemCard,
                        {
                          backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.15)' : (isDark ? '#1c1c1e' : '#f8fafc'),
                          borderColor: isCurrentUser ? 'rgba(255,255,255,0.25)' : (isDark ? '#2c2c2e' : '#e2e8f0'),
                        },
                      ]}
                    >
                      <View style={[styles.docIconBadge, { backgroundColor: badgeBg }]}>
                        <Ionicons
                          name={isPdf ? 'document-text' : isExcel ? 'grid' : isWord ? 'document' : 'document-attach'}
                          size={20}
                          color={badgeColor}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.docNameText, { color: isCurrentUser ? '#ffffff' : colors.text }]} numberOfLines={1}>
                          {att.originalName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View style={{ backgroundColor: badgeBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '700', color: badgeColor }}>{ext}</Text>
                          </View>
                          <Text style={[styles.docSizeText, { color: isCurrentUser ? 'rgba(255,255,255,0.75)' : colors.placeholder }]}>
                            {formattedSize}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.docActionBtn, { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : (isDark ? '#2c2c2e' : '#e2e8f0') }]}>
                        <Ionicons name="arrow-down" size={15} color={isCurrentUser ? '#ffffff' : colors.primary} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })()}

          {message.body ? (
            <Text style={[styles.bubbleText, { color: isCurrentUser ? '#ffffff' : colors.text }]}>
              {message.body}
            </Text>
          ) : null}

          <View style={styles.timeRow}>
            {isStarred && (
              <Ionicons
                name="star"
                size={11}
                color={isCurrentUser ? '#fbbf24' : '#f59e0b'}
                style={{ marginRight: 3 }}
              />
            )}
            <Text style={[styles.msgTimeText, { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.placeholder }]}>
              {formatMsgTime(message.sentAt)}
            </Text>
            {isCurrentUser && (
              <Animated.View entering={ZoomIn.duration(200).springify().damping(14)}>
                {message.status === 'sending' ? (
                  <Ionicons name="time-outline" size={13} color="rgba(255, 255, 255, 0.75)" style={{ marginLeft: 3 }} />
                ) : message.status === 'read' ? (
                  <Ionicons name="checkmark-done" size={14} color="#38bdf8" style={{ marginLeft: 3 }} />
                ) : message.status === 'delivered' ? (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: 3 }} />
                ) : message.status === 'error' ? (
                  <Ionicons name="alert-circle" size={14} color="#ef4444" style={{ marginLeft: 3 }} />
                ) : (
                  <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: 3 }} />
                )}
              </Animated.View>
            )}
          </View>

          {/* Reactions List */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <View style={[styles.reactionsRow, isCurrentUser ? styles.reactionsRight : styles.reactionsLeft, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {Object.keys(message.reactions).map((emoji) => {
                const flagCode = getCountryCodeFromFlag(emoji);
                if (flagCode) {
                  return (
                    <Image
                      key={emoji}
                      source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
                      style={{ width: 14, height: 10, borderRadius: 1, marginHorizontal: 1, alignSelf: 'center' }}
                    />
                  );
                }
                return (
                  <Text key={emoji} style={styles.reactionEmoji}>
                    {emoji}
                  </Text>
                );
              })}
            </View>
          )}
        </Pressable>

        {/* Nigerian Bank Wire Fraud Warning Banner */}
        {hasPaymentWarning && (
          <View
            style={[
              styles.fraudWarningBanner,
              {
                backgroundColor: isDark ? '#261215' : '#fff1f2',
                borderColor: isDark ? '#4c1d24' : '#fecdd3',
              },
            ]}
          >
            <Ionicons name="warning" size={14} color="#e11d48" style={{ marginTop: 1 }} />
            <Text style={[styles.fraudWarningText, { color: isDark ? '#fca5a5' : '#be123c' }]}>
              Security Alert: Never transfer funds to private bank accounts in chat. DeltanHub staff will never ask for direct transfers or inspection fees. Always use official verified escrow.
            </Text>
          </View>
        )}
      </View>

      {/* Full Emoji Picker Modal Sheet */}
      <Modal
        visible={showFullPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFullPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFullPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>React with Emoji</Text>
              <TouchableOpacity onPress={() => setShowFullPicker(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                onReactToMessage?.(message.id, emoji);
                setShowFullPicker(false);
                setShowReactionPopover(false);
              }}
              onClose={() => setShowFullPicker(false)}
            />
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  bubbleTextContainer: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  bubbleCurrent: {
    borderBottomRightRadius: 2,
  },
  bubblePartner: {
    borderBottomLeftRadius: 2,
  },
  authorLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingLeft: 4,
  },
  staffTagLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    lineHeight: 20,
  },
  quotedReplyBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 6,
  },
  quotedAuthor: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Typography.fontFamily,
  },
  quotedBody: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Typography.fontFamily,
  },
  mediaGrid: {
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 4,
  },
  mediaItemContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
  },
  videoOverlayBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  docsList: {
    marginBottom: 6,
    gap: 6,
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 260,
  },
  docIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  docSizeText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  docActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  msgTimeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
  },
  reactionsRow: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    elevation: 2,
  },
  reactionsRight: {
    right: 8,
  },
  reactionsLeft: {
    left: 8,
  },
  reactionEmoji: {
    fontSize: 11,
  },
  popoverContainer: {
    position: 'absolute',
    top: -46,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  popoverRight: {
    right: 12,
  },
  popoverLeft: {
    left: 12,
  },
  popoverEmojiBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  popoverPlusBtn: {
    marginLeft: 2,
  },
  popoverEmoji: {
    fontSize: 20,
  },
  fraudWarningBanner: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '100%',
  },
  fraudWarningText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  modalCloseBtn: {
    padding: 4,
  },
});
