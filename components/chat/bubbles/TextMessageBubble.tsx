import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { getStaffTag, detectPaymentRequest } from './types';
import {
  styles, TextReactionPopover, TextEmojiPickerModal, TextQuotedReply,
  TextMediaGrid, TextDocumentList, TextReactionPillRow, TextStatusFooter,
  TextFraudWarning, useTextMessageAttachments, TextMessageBubbleProps,
} from './text';

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

  const { mediaItems, documentItems } = useTextMessageAttachments(message);

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
      <View style={{ maxWidth: '78%', alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
        {showReactionPopover && (
          <TextReactionPopover
            isCurrentUser={isCurrentUser} colors={colors} isDark={isDark}
            onSelectEmoji={handleQuickReaction} onOpenFullPicker={() => setShowFullPicker(true)}
          />
        )}

        <Pressable
          onLongPress={() => {
            if (onLongPressMessage) onLongPressMessage(message);
            else setShowReactionPopover((prev) => !prev);
          }}
          delayLongPress={260}
          style={({ pressed }) => [
            styles.bubbleTextContainer,
            isCurrentUser ? [styles.bubbleCurrent, { backgroundColor: colors.primary }] : [styles.bubblePartner, { backgroundColor: colors.card }],
            { borderColor: isCurrentUser ? colors.primary : colors.border, opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
          ]}
        >
          {!isCurrentUser && (
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>
              {message.authorName}
            </Text>
          )}

          {staffTag && (
            <Text style={[styles.staffTagLabel, { color: isCurrentUser ? 'rgba(255, 255, 255, 0.65)' : isDark ? '#a1a1aa' : '#7b6570' }]}>
              {staffTag}
            </Text>
          )}

          <TextQuotedReply
            replyToData={replyToData} isCurrentUser={isCurrentUser} isDark={isDark}
            primaryColor={colors.primary} placeholderColor={colors.placeholder}
          />

          <TextMediaGrid mediaItems={mediaItems} messageBody={message.body} onPressMedia={onPressMedia} />

          <TextDocumentList
            documents={documentItems} isCurrentUser={isCurrentUser} isDark={isDark}
            textColor={colors.text} placeholderColor={colors.placeholder} primaryColor={colors.primary}
          />

          {message.body ? (
            <Text style={[styles.bubbleText, { color: isCurrentUser ? '#ffffff' : colors.text }]}>
              {message.body}
            </Text>
          ) : null}

          <TextStatusFooter
            sentAt={message.sentAt} status={message.status} isCurrentUser={isCurrentUser}
            isStarred={isStarred} placeholderColor={colors.placeholder}
          />

          <TextReactionPillRow
            reactions={message.reactions || {}} isCurrentUser={isCurrentUser}
            borderColor={colors.border} cardColor={colors.card}
          />
        </Pressable>

        {hasPaymentWarning && <TextFraudWarning isDark={isDark} />}
      </View>

      <TextEmojiPickerModal
        visible={showFullPicker} colors={colors}
        onClose={() => setShowFullPicker(false)}
        onSelectEmoji={(emoji) => {
          onReactToMessage?.(message.id, emoji);
          setShowFullPicker(false);
          setShowReactionPopover(false);
        }}
      />
    </Animated.View>
  );
}
