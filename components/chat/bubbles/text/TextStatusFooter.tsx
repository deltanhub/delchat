import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Typography } from '../../../../constants/Typography';
import { formatMsgTime } from '../types';
import { TextStatusFooterProps } from './types';

export function TextStatusFooter({
  sentAt,
  status,
  isCurrentUser,
  isStarred = false,
  placeholderColor,
}: TextStatusFooterProps) {
  return (
    <View style={styles.timeRow}>
      {isStarred && (
        <Ionicons
          name="star"
          size={11}
          color={isCurrentUser ? '#fbbf24' : '#f59e0b'}
          style={{ marginRight: 3 }}
        />
      )}
      <Text style={[styles.msgTimeText, { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : placeholderColor }]}>
        {formatMsgTime(sentAt)}
      </Text>
      {isCurrentUser && (
        <Animated.View entering={ZoomIn.duration(200).springify().damping(14)}>
          {status === 'sending' ? (
            <Ionicons name="time-outline" size={13} color="rgba(255, 255, 255, 0.75)" style={{ marginLeft: 3 }} />
          ) : status === 'read' ? (
            <Ionicons name="checkmark-done" size={14} color="#38bdf8" style={{ marginLeft: 3 }} />
          ) : status === 'delivered' ? (
            <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: 3 }} />
          ) : status === 'error' ? (
            <Ionicons name="alert-circle" size={14} color="#ef4444" style={{ marginLeft: 3 }} />
          ) : (
            <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: 3 }} />
          )}
        </Animated.View>
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
});

export default TextStatusFooter;
