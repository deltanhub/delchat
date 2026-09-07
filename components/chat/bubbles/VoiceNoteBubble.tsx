import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import EmojiPicker from '../EmojiPicker';
import * as Haptics from '../../../lib/haptics';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import {
  ChatMessage,
  formatMsgTime,
  getStaffTag,
  WAVEFORM_BAR_HEIGHTS,
  registerAudioPlayback,
  stopAudioPlayback,
  subscribeAudioPlayback,
} from './types';

interface VoiceNoteBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onLongPressMessage?: (message: ChatMessage) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onOpenFullEmojiPicker?: () => void;
}

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

  const rawDuration =
    message.structuredPayload?.voiceNote?.durationSeconds ||
    message.voice_note_duration_seconds ||
    3;
  const duration = Math.max(1, Number(rawDuration) || 3);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const playbackTimerRef = useRef<any>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const audioUri =
    message.structuredPayload?.voiceNote?.audioUrl ||
    message.structuredPayload?.voiceNote?.localUri ||
    (message.attachments && message.attachments.length > 0 ? message.attachments[0].url : null);

  const replyToData = message.structuredPayload?.replyTo;
  const staffTag = getStaffTag(message);

  // Auto-pause when another voice note starts playing
  useEffect(() => {
    const unsubscribe = subscribeAudioPlayback((activeMessageId) => {
      if (activeMessageId !== message.id && isPlaying) {
        setIsPlaying(false);
        if (playerRef.current) {
          try {
            playerRef.current.pause();
          } catch {}
        }
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      }
    });
    return unsubscribe;
  }, [message.id, isPlaying]);

  useEffect(() => {
    return () => {
      stopAudioPlayback(message.id);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.release();
        } catch {}
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [message.id]);

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioPlayback(message.id);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch (e) {}
      }
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    } else {
      setIsPlaying(true);
      registerAudioPlayback({
        messageId: message.id,
        player: playerRef.current,
        pause: () => {
          setIsPlaying(false);
          if (playerRef.current) {
            try {
              playerRef.current.pause();
            } catch {}
          }
          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        },
      });

      if (audioUri) {
        try {
          await setAudioModeAsync({
            allowsRecording: false,
            playsInSilentMode: true,
            shouldPlayInBackground: false,
          });

          if (!playerRef.current) {
            const player = createAudioPlayer(audioUri, { updateInterval: 100 });
            player.setPlaybackRate(playbackSpeed);
            player.addListener('playbackStatusUpdate', (status) => {
              if (status.isLoaded) {
                if (status.currentTime !== undefined) {
                  setPlaybackSeconds(status.currentTime);
                }
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  stopAudioPlayback(message.id);
                  setPlaybackSeconds(0);
                  playerRef.current?.seekTo(0).catch(() => {});
                }
              }
            });
            playerRef.current = player;
            player.play();
            registerAudioPlayback({
              messageId: message.id,
              player,
              pause: () => {
                setIsPlaying(false);
                try {
                  player.pause();
                } catch {}
                if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
              },
            });
            return;
          } else {
            playerRef.current.setPlaybackRate(playbackSpeed);
            playerRef.current.play();
            registerAudioPlayback({
              messageId: message.id,
              player: playerRef.current,
              pause: () => {
                setIsPlaying(false);
                try {
                  playerRef.current?.pause();
                } catch {}
                if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
              },
            });
            return;
          }
        } catch (err) {
          console.warn('Error playing audio sound:', err);
        }
      }

      // Fallback timer simulation for legacy voice notes without audio stream
      const intervalMs = 250 / playbackSpeed;
      playbackTimerRef.current = setInterval(() => {
        setPlaybackSeconds((prev) => {
          const next = prev + 0.25;
          if (next >= duration) {
            setIsPlaying(false);
            stopAudioPlayback(message.id);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            return 0;
          }
          return next;
        });
      }, intervalMs);
    }
  };

  const handleCycleSpeed = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSpeed: 1 | 1.5 | 2 = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackRate(nextSpeed);
      } catch (e) {}
    }
  };

  const formatAudioTime = (secs: number) => {
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? playbackSeconds / duration : 0;
  const activeBarsCount = Math.floor(progressRatio * WAVEFORM_BAR_HEIGHTS.length);

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
              onPress={() => {
                onReactToMessage?.(message.id, emoji);
                setShowReactionPopover(false);
              }}
              accessibilityLabel={`React with ${emoji}`}
              accessibilityRole="button"
              style={styles.popoverEmojiBtn}
            >
              <Text style={styles.popoverEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              setShowReactionPopover(false);
              setShowFullPicker(true);
            }}
            accessibilityLabel="Open all reaction emojis"
            accessibilityRole="button"
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
          styles.voiceNoteBubble,
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
          <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>
            {message.authorName}
          </Text>
        )}

        {staffTag && (
          <Text
            style={[
              styles.staffTagLabel,
              {
                color: isCurrentUser
                  ? 'rgba(255, 255, 255, 0.65)'
                  : isDark
                  ? '#a1a1aa'
                  : '#7b6570',
              },
            ]}
          >
            {staffTag}
          </Text>
        )}

        {/* WhatsApp-Style Quoted Reply Box */}
        {replyToData && (
          <View
            style={[
              styles.quotedReplyBox,
              {
                backgroundColor: isCurrentUser
                  ? 'rgba(0, 0, 0, 0.15)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#e2e8f0',
                borderLeftColor: isCurrentUser ? '#ffffff' : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.quotedAuthor,
                { color: isCurrentUser ? '#ffffff' : isDark ? '#ffffff' : colors.primary },
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

        {/* Voice Note Player Row */}
        <View style={styles.voiceNoteMainRow}>
          {/* Play / Pause Circle */}
          <TouchableOpacity
            onPress={handleTogglePlay}
            accessibilityLabel={isPlaying ? "Pause voice note" : "Play voice note"}
            accessibilityRole="button"
            accessibilityHint={isPlaying ? "Pauses voice note audio" : `Plays voice note audio, duration ${formatAudioTime(duration)}`}
            style={[
              styles.vnPlayBtn,
              {
                backgroundColor: isCurrentUser
                  ? '#ffffff'
                  : isDark
                  ? '#4A0F1F'
                  : colors.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={
                isCurrentUser
                  ? colors.primary
                  : '#ffffff'
              }
              style={!isPlaying ? { marginLeft: 2 } : undefined}
            />
          </TouchableOpacity>

          {/* Waveform and Duration */}
          <View style={styles.vnWaveformCol}>
            <View style={styles.vnWaveformBarsRow}>
              {WAVEFORM_BAR_HEIGHTS.map((h, i) => {
                const isActive = i <= activeBarsCount;
                return (
                  <View
                    key={i}
                    style={[
                      styles.vnWaveBar,
                      {
                        height: h,
                        backgroundColor: isCurrentUser
                          ? isActive
                            ? '#ffffff'
                            : 'rgba(255, 255, 255, 0.38)'
                          : isActive
                          ? isDark
                            ? '#f4a5b8'
                            : colors.primary
                          : isDark
                          ? '#3f3f46'
                          : '#cbd5e1',
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.vnMetaRow}>
              <Text
                style={[
                  styles.vnDurationText,
                  {
                    color: isCurrentUser
                      ? 'rgba(255, 255, 255, 0.88)'
                      : colors.placeholder,
                  },
                ]}
              >
                {formatAudioTime(playbackSeconds > 0 ? playbackSeconds : duration)}
              </Text>

              {/* Speed Multiplier Pill */}
              <TouchableOpacity
                onPress={handleCycleSpeed}
                accessibilityLabel={`Playback speed ${playbackSpeed}x`}
                accessibilityRole="button"
                accessibilityHint="Double tap to cycle playback speed between 1x, 1.5x, and 2x"
                style={[
                  styles.vnSpeedPill,
                  {
                    backgroundColor: isCurrentUser
                      ? 'rgba(255, 255, 255, 0.22)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#e2e8f0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.vnSpeedText,
                    {
                      color: isCurrentUser ? '#ffffff' : colors.text,
                    },
                  ]}
                >
                  {playbackSpeed}x
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trailing Mic Icon */}
          <View style={styles.vnAvatarCol}>
            <View
              style={[
                styles.vnAvatarPlaceholder,
                {
                  backgroundColor: isCurrentUser
                    ? 'rgba(255, 255, 255, 0.2)'
                    : isDark
                    ? '#27272a'
                    : '#f1f5f9',
                },
              ]}
            >
              <Ionicons
                name="mic"
                size={16}
                color={
                  isCurrentUser
                    ? '#ffffff'
                    : isDark
                    ? '#f4a5b8'
                    : colors.primary
                }
              />
            </View>
          </View>
        </View>

        {/* Message Timestamp & Status Checks */}
        <View style={styles.timeRow}>
          {isStarred && (
            <Ionicons
              name="star"
              size={11}
              color={isCurrentUser ? '#fbbf24' : '#f59e0b'}
              style={{ marginRight: 3 }}
            />
          )}
          <Text
            style={[
              styles.msgTimeText,
              { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.placeholder },
            ]}
          >
            {formatMsgTime(message.sentAt)}
          </Text>

          {isCurrentUser && (
            <Ionicons
              name={
                message.status === 'read'
                  ? 'checkmark-done'
                  : message.status === 'delivered'
                  ? 'checkmark-done-outline'
                  : message.status === 'sending'
                  ? 'time-outline'
                  : message.status === 'error'
                  ? 'alert-circle'
                  : 'checkmark-outline'
              }
              size={14}
              color={
                message.status === 'read'
                  ? '#38bdf8'
                  : message.status === 'error'
                  ? '#ef4444'
                  : 'rgba(255, 255, 255, 0.7)'
              }
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </Pressable>

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
  voiceNoteBubble: {
    minWidth: 240,
    maxWidth: 310,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  voiceNoteMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  vnPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  vnWaveformCol: {
    flex: 1,
    gap: 4,
  },
  vnWaveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.2,
    height: 28,
  },
  vnWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  vnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vnDurationText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  vnSpeedPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  vnSpeedText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  vnAvatarCol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vnAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
