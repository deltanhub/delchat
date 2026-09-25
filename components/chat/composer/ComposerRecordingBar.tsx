import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { Typography } from '../../../constants/Typography';
import { ComposerRecordingBarProps } from './types';

export function ComposerRecordingBar({
  recordingSeconds,
  textColor,
  primaryColor,
  formatRecordTime,
  onCancelRecording,
  onSendRecording,
}: ComposerRecordingBarProps) {
  return (
    <View style={styles.recordingRow}>
      <View style={styles.recordingIndicatorCol}>
        <View style={[styles.recordDot, { backgroundColor: '#ef4444' }]} />
        <Text style={[styles.recordingTime, { color: textColor }]}>
          Recording {formatRecordTime(recordingSeconds)}
        </Text>
      </View>

      <View style={styles.recordingActionsCol}>
        <ScalePressable
          onPress={onCancelRecording}
          accessibilityLabel="Cancel recording"
          accessibilityRole="button"
          accessibilityHint="Discards the recorded audio"
          style={styles.recordActionBtn}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
        </ScalePressable>

        <ScalePressable
          onPress={onSendRecording}
          accessibilityLabel="Send voice note"
          accessibilityRole="button"
          accessibilityHint="Sends the recorded voice note"
          style={[styles.recordSendBtn, { backgroundColor: primaryColor }]}
        >
          <Ionicons name="arrow-up" size={22} color="#ffffff" />
        </ScalePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  recordingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 6,
  },
  recordingIndicatorCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingTime: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  recordingActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  recordSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
