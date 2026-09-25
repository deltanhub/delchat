import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceNotePlayButtonProps } from './types';

export function VoiceNotePlayButton({
  player,
  isCurrentUser,
  isDark,
  primaryColor,
}: VoiceNotePlayButtonProps) {
  const { isPlaying, duration, handleTogglePlay, formatAudioTime } = player;

  return (
    <TouchableOpacity
      onPress={handleTogglePlay}
      accessibilityLabel={isPlaying ? 'Pause voice note' : 'Play voice note'}
      accessibilityRole="button"
      accessibilityHint={
        isPlaying
          ? 'Pauses voice note audio'
          : `Plays voice note audio, duration ${formatAudioTime(duration)}`
      }
      style={[
        styles.vnPlayBtn,
        {
          backgroundColor: isCurrentUser
            ? '#ffffff'
            : isDark
            ? '#4A0F1F'
            : primaryColor,
        },
      ]}
      activeOpacity={0.8}
    >
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={20}
        color={isCurrentUser ? primaryColor : '#ffffff'}
        style={!isPlaying ? { marginLeft: 2 } : undefined}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
