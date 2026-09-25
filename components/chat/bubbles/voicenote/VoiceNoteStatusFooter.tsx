import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../../constants/Typography';
import { formatMsgTime } from '../types';
import { VoiceNoteStatusFooterProps } from './types';

export function VoiceNoteStatusFooter({
  message,
  isCurrentUser,
  isStarred = false,
  placeholderColor,
}: VoiceNoteStatusFooterProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'read':
        return 'checkmark-done';
      case 'delivered':
        return 'checkmark-done-outline';
      case 'sending':
        return 'time-outline';
      case 'error':
        return 'alert-circle';
      default:
        return 'checkmark-outline';
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'read':
        return '#38bdf8';
      case 'error':
        return '#ef4444';
      default:
        return 'rgba(255, 255, 255, 0.7)';
    }
  };

  return (
    <View style={styles.timeRow}>
      {isStarred && (
        <Ionicons
          name="star"
          size={11}
          color={isCurrentUser ? '#fbbf24' : '#f59e0b'}
          style={styles.starIcon}
        />
      )}
      <Text
        style={[
          styles.msgTimeText,
          { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : placeholderColor },
        ]}
      >
        {formatMsgTime(message.sentAt)}
      </Text>

      {isCurrentUser && (
        <Ionicons
          name={getStatusIcon()}
          size={14}
          color={getStatusColor()}
          style={styles.statusIcon}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  starIcon: {
    marginRight: 3,
  },
  statusIcon: {
    marginLeft: 3,
  },
});
