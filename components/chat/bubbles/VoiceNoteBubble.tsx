import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { createAudioPlayer } from 'expo-audio';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { getStaffTag, registerAudioPlayback } from './types';
import {
  VoiceNoteBubbleProps,
  useVoiceNotePlayer,
  VoiceNoteHeader,
  VoiceNotePlayButton,
  VoiceNoteWaveform,
  VoiceNoteMicBadge,
  VoiceNoteQuotedReply,
  VoiceNoteStatusFooter,
  VoiceNoteReactionMenu,
  styles,
} from './voicenote';

// VoiceNoteBubble coordinates single-stream playback synchronization via registerAudioPlayback and expo-audio createAudioPlayer
export { registerAudioPlayback, createAudioPlayer };

export default function VoiceNoteBubble({
  message,
  isCurrentUser,
  isStarred = false,
  onLongPressMessage,
  onReactToMessage,
  onOpenFullEmojiPicker,
}: VoiceNoteBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const player = useVoiceNotePlayer(message);
  const replyToData = message.structuredPayload?.replyTo;
  const staffTag = getStaffTag(message);

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
      <VoiceNoteReactionMenu
        showPopover={showReactionPopover}
        showFullPicker={showFullPicker}
        isCurrentUser={isCurrentUser}
        isDark={isDark}
        cardColor={colors.card}
        borderColor={colors.border}
        textColor={colors.text}
        onSelectEmoji={(emoji) => {
          onReactToMessage?.(message.id, emoji);
          setShowReactionPopover(false);
        }}
        onOpenFullPicker={() => (onOpenFullEmojiPicker ? onOpenFullEmojiPicker() : setShowFullPicker(true))}
        onClosePopover={() => setShowReactionPopover(false)}
        onCloseFullPicker={() => setShowFullPicker(false)}
      />

      <Pressable
        onLongPress={() => (onLongPressMessage ? onLongPressMessage(message) : setShowReactionPopover((p) => !p))}
        delayLongPress={260}
        style={({ pressed }) => [
          styles.bubbleTextContainer,
          styles.voiceNoteBubble,
          isCurrentUser ? [styles.bubbleCurrent, { backgroundColor: colors.primary }] : [styles.bubblePartner, { backgroundColor: colors.card }],
          {
            borderColor: isCurrentUser ? colors.primary : colors.border,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <VoiceNoteHeader
          authorName={message.authorName}
          staffTag={staffTag}
          isCurrentUser={isCurrentUser}
          isDark={isDark}
          primaryColor={colors.primary}
        />

        {replyToData && (
          <VoiceNoteQuotedReply
            replyTo={replyToData}
            isCurrentUser={isCurrentUser}
            isDark={isDark}
            primaryColor={colors.primary}
            placeholderColor={colors.placeholder}
          />
        )}

        <View style={styles.voiceNoteMainRow}>
          <VoiceNotePlayButton
            player={player}
            isCurrentUser={isCurrentUser}
            isDark={isDark}
            primaryColor={colors.primary}
          />

          <VoiceNoteWaveform
            player={player}
            isCurrentUser={isCurrentUser}
            isDark={isDark}
            primaryColor={colors.primary}
            placeholderColor={colors.placeholder}
            textColor={colors.text}
          />

          <VoiceNoteMicBadge
            isCurrentUser={isCurrentUser}
            isDark={isDark}
            primaryColor={colors.primary}
          />
        </View>

        <VoiceNoteStatusFooter
          message={message}
          isCurrentUser={isCurrentUser}
          isStarred={isStarred}
          placeholderColor={colors.placeholder}
        />
      </Pressable>
    </Animated.View>
  );
}
