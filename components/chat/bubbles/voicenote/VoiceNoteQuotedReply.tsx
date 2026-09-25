import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Typography } from '../../../../constants/Typography';
import { VoiceNoteQuotedReplyProps } from './types';

export function VoiceNoteQuotedReply({
  replyTo,
  isCurrentUser,
  isDark,
  primaryColor,
  placeholderColor,
}: VoiceNoteQuotedReplyProps) {
  return (
    <View
      style={[
        styles.quotedReplyBox,
        {
          backgroundColor: isCurrentUser
            ? 'rgba(0, 0, 0, 0.15)'
            : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : '#e2e8f0',
          borderLeftColor: isCurrentUser ? '#ffffff' : primaryColor,
        },
      ]}
    >
      <Text
        style={[
          styles.quotedAuthor,
          { color: isCurrentUser ? '#ffffff' : isDark ? '#ffffff' : primaryColor },
        ]}
        numberOfLines={1}
      >
        {replyTo.authorName || 'Member'}
      </Text>
      <Text
        style={[
          styles.quotedBody,
          { color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : placeholderColor },
        ]}
        numberOfLines={2}
      >
        {replyTo.body || 'Message'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
