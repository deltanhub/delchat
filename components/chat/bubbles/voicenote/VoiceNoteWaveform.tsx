import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Typography } from '../../../../constants/Typography';
import { WAVEFORM_BAR_HEIGHTS } from '../types';
import { VoiceNoteWaveformProps } from './types';

export function VoiceNoteWaveform({
  player,
  isCurrentUser,
  isDark,
  primaryColor,
  placeholderColor,
  textColor,
}: VoiceNoteWaveformProps) {
  const {
    activeBarsCount,
    duration,
    playbackSeconds,
    playbackSpeed,
    handleCycleSpeed,
    formatAudioTime,
  } = player;

  return (
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
                      : primaryColor
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
              color: isCurrentUser ? 'rgba(255, 255, 255, 0.88)' : placeholderColor,
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
                color: isCurrentUser ? '#ffffff' : textColor,
              },
            ]}
          >
            {playbackSpeed}x
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
