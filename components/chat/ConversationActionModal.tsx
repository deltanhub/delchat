import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from '../../lib/haptics';
import { Typography } from '../../constants/Typography';
import { ChatConversation } from './ConversationRow';
import { supabase } from '../../lib/supabase';

interface ConversationActionModalProps {
  visible: boolean;
  conversation: ChatConversation | null;
  currentUserId?: string;
  onClose: () => void;
  onOpenConversation?: (conversationId: string) => void;
  onToggleArchive: (conversationId: string, currentArchived: boolean) => void;
  onToggleMute: (conversationId: string, currentMuted: boolean) => void;
  onMarkReadToggle: (conversationId: string, currentUnread: boolean) => void;
  onDeleteConversation: (conversationId: string) => void;
  onClearConversation?: (conversationId: string) => void;
  onBlockUser?: (conversation: ChatConversation) => void;
  onTogglePin?: (conversationId: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
}: ConversationActionModalProps) {
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && conversation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);

      (async () => {
        try {
          const { data } = await supabase
            .from('chat_messages')
            .select('id, sender_user_id, body, created_at, message_kind')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(10);

          setRecentMessages(data ? [...data].reverse() : []);
        } catch {
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [visible, conversation]);

  if (!visible || !conversation) return null;

  const isArchived = Boolean(conversation.isArchived);
  const isMuted = Boolean(conversation.isMuted);
  const isUnread = conversation.unreadCount > 0;
  const isBlocked = Boolean(conversation.isBlocked);

  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onOpenConversation) {
      onOpenConversation(conversation.id);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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
          
          {/* 1. TOP PEEK PREVIEW CARD (Interactive, Scrollable & Tap-to-Open) */}
          <Animated.View
            entering={ZoomIn.duration(200).springify()}
            style={styles.peekCard}
          >
            {/* Header: Tap to open chat */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenChat}
              style={styles.peekHeader}
            >
              <View style={styles.peekAvatarInitials}>
                <Text style={styles.peekAvatarInitialsText}>{getInitials(conversation.partnerName)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                <Text style={styles.peekHeaderTitle} numberOfLines={1}>
                  {conversation.partnerName}
                </Text>
                {Boolean(conversation.listing?.title || conversation.partnerSubtitle) && (
                  <Text style={styles.peekHeaderSub} numberOfLines={1}>
                    {conversation.listing?.title || conversation.partnerSubtitle}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>

            {/* Scrollable Chat Feed Inside Preview */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.peekBody}
              contentContainerStyle={styles.peekBodyContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#f4a5b8" />
                </View>
              ) : recentMessages.length > 0 ? (
                recentMessages.map((msg) => {
                  const isMe = msg.sender_user_id === currentUserId;
                  return (
                    <TouchableOpacity
                      key={msg.id}
                      activeOpacity={0.85}
                      onPress={handleOpenChat}
                      style={[
                        styles.peekBubble,
                        isMe ? styles.peekBubbleMe : styles.peekBubbleOther,
                      ]}
                    >
                      {isMe && <Text style={styles.peekSenderLabel}>You</Text>}
                      <Text style={[styles.peekMsgText, { color: '#ffffff' }]}>
                        {msg.body || (msg.message_kind === 'attachments' ? 'Photo / Attachment' : 'Message')}
                      </Text>
                      <Text style={styles.peekTimeText}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <TouchableOpacity activeOpacity={0.85} onPress={handleOpenChat} style={[styles.peekBubble, styles.peekBubbleOther]}>
                  <Text style={[styles.peekMsgText, { color: '#ffffff' }]}>
                    {conversation.preview || 'No messages yet'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Tap-able Mock Input Bar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenChat}
              style={styles.peekInputBar}
            >
              <Ionicons name="add" size={20} color="#8e8e93" />
              <View style={styles.peekInputMock}>
                <Text style={styles.peekInputMockText}>Message</Text>
              </View>
              <Ionicons name="camera-outline" size={19} color="#8e8e93" />
              <Ionicons name="mic-outline" size={19} color="#8e8e93" />
            </TouchableOpacity>
          </Animated.View>

          {/* 2. BOTTOM FLOATING CONTEXT MENU (iOS Context Menu Style) */}
          <Animated.View
            entering={SlideInDown.duration(220).springify()}
            style={styles.contextMenuCard}
          >
            {/* 0. Pin / Unpin */}
            {onTogglePin && (
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                  onTogglePin(conversation.id);
                }}
                style={styles.menuRow}
              >
                <Text style={styles.menuRowText}>
                  {conversation.isPinned ? 'Unpin from Top' : 'Pin to Top (Max 5)'}
                </Text>
                <Ionicons
                  name={conversation.isPinned ? 'pin' : 'pin-outline'}
                  size={19}
                  color={conversation.isPinned ? '#ff9500' : '#8e8e93'}
                />
              </TouchableOpacity>
            )}

            {/* 1. Mark as unread / read */}
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
                onMarkReadToggle(conversation.id, isUnread);
              }}
              style={styles.menuRow}
            >
              <Text style={styles.menuRowText}>
                {isUnread ? 'Mark as read' : 'Mark as unread'}
              </Text>
              <Ionicons
                name={isUnread ? 'checkmark-done' : 'chatbubble-ellipses-outline'}
                size={19}
                color={isUnread ? '#34c759' : '#8e8e93'}
              />
            </TouchableOpacity>

            {/* 2. Archive */}
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
                onToggleArchive(conversation.id, isArchived);
              }}
              style={styles.menuRow}
            >
              <Text style={styles.menuRowText}>
                {isArchived ? 'Unarchive' : 'Archive'}
              </Text>
              <Ionicons name="archive-outline" size={19} color="#8e8e93" />
            </TouchableOpacity>

            {/* 3. Mute */}
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
                onToggleMute(conversation.id, isMuted);
              }}
              style={styles.menuRow}
            >
              <Text style={styles.menuRowText}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
              <Ionicons
                name={isMuted ? 'volume-high-outline' : 'notifications-off-outline'}
                size={19}
                color="#8e8e93"
              />
            </TouchableOpacity>

            {/* 4. Add to Favourites */}
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.menuRow}
            >
              <Text style={styles.menuRowText}>Add to Favourites</Text>
              <Ionicons name="heart-outline" size={19} color="#8e8e93" />
            </TouchableOpacity>

            {/* 5. Block / Unblock user */}
            {onBlockUser && (
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                  onBlockUser(conversation);
                }}
                style={styles.menuRow}
              >
                <Text style={styles.menuRowText} numberOfLines={1}>
                  {isBlocked ? `Unblock ${conversation.partnerName}` : `Block ${conversation.partnerName}`}
                </Text>
                <Ionicons name="ban-outline" size={19} color="#8e8e93" />
              </TouchableOpacity>
            )}

            {/* 6. Clear chat */}
            {onClearConversation && (
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                  onClearConversation(conversation.id);
                }}
                style={styles.menuRow}
              >
                <Text style={styles.menuRowText}>Clear chat</Text>
                <Ionicons name="close-circle-outline" size={19} color="#8e8e93" />
              </TouchableOpacity>
            )}

            {/* 7. Delete chat (Destructive Red) */}
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
                onDeleteConversation(conversation.id);
              }}
              style={[styles.menuRow, styles.lastMenuRow]}
            >
              <Text style={[styles.menuRowText, styles.destructiveText]}>
                Delete chat
              </Text>
              <Ionicons name="trash-outline" size={19} color="#ff453a" />
            </TouchableOpacity>

          </Animated.View>

        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  peekCard: {
    width: '100%',
    height: Math.min(230, SCREEN_HEIGHT * 0.32),
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 14,
    marginBottom: 12,
  },
  peekHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#252528',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  peekAvatarInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A0F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekAvatarInitialsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  peekHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  peekHeaderSub: {
    color: '#8e8e93',
    fontSize: 11,
    fontFamily: Typography.fontFamily,
    marginTop: 1,
  },
  peekBody: {
    flex: 1,
    backgroundColor: '#151517',
  },
  peekBodyContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    justifyContent: 'flex-end',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  peekBubble: {
    maxWidth: '82%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  peekBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A0F1F',
    borderBottomRightRadius: 2,
  },
  peekBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#2c2c2e',
    borderBottomLeftRadius: 2,
  },
  peekSenderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f4a5b8',
    marginBottom: 1,
  },
  peekMsgText: {
    fontSize: 12.5,
    lineHeight: 16.5,
    fontFamily: Typography.fontFamily,
  },
  peekTimeText: {
    fontSize: 9,
    alignSelf: 'flex-end',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  peekInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#252528',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  peekInputMock: {
    flex: 1,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  peekInputMockText: {
    fontSize: 11,
    color: '#636366',
  },
  contextMenuCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#252528',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  lastMenuRow: {
    borderBottomWidth: 0,
  },
  menuRowText: {
    fontSize: 15,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '400',
    flex: 1,
    paddingRight: 8,
  },
  destructiveText: {
    color: '#ff453a',
    fontWeight: '500',
  },
});
