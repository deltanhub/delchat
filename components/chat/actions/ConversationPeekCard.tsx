import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { styles } from './styles';
import { ConversationPeekCardProps } from './types';

function getInitials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ConversationPeekCard({
  conversation,
  recentMessages,
  loading,
  currentUserId,
  onOpenChat,
}: ConversationPeekCardProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <Animated.View
      entering={ZoomIn.duration(200).springify()}
      style={styles.peekCard}
    >
      {/* Header: Tap to open chat */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenChat}
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
                onPress={onOpenChat}
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
          <TouchableOpacity activeOpacity={0.85} onPress={onOpenChat} style={[styles.peekBubble, styles.peekBubbleOther]}>
            <Text style={[styles.peekMsgText, { color: '#ffffff' }]}>
              {conversation.preview || 'No messages yet'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Tap-able Mock Input Bar */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenChat}
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
  );
}

export default ConversationPeekCard;
