import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { Typography } from '../../../constants/Typography';
import { ComposerReplyBannerProps } from './types';

export function ComposerReplyBanner({
  replyingToMessage,
  isDark,
  primaryColor,
  placeholderColor,
  onCancelReply,
}: ComposerReplyBannerProps) {
  return (
    <View
      style={[
        styles.replyBanner,
        {
          backgroundColor: isDark ? '#18181b' : '#f8fafc',
          borderLeftColor: primaryColor,
          borderColor: isDark ? '#27272a' : '#e2e8f0',
        },
      ]}
    >
      <View style={styles.replyContentCol}>
        <Text
          style={[
            styles.replyAuthorText,
            { color: isDark ? '#ffffff' : primaryColor },
          ]}
        >
          Replying to {replyingToMessage.authorName}
        </Text>
        <Text
          style={[styles.replySnippetText, { color: placeholderColor }]}
          numberOfLines={1}
        >
          {replyingToMessage.body || 'Attachment'}
        </Text>
      </View>
      <ScalePressable
        onPress={onCancelReply}
        accessibilityLabel="Cancel replying"
        accessibilityRole="button"
        accessibilityHint="Dismisses the quoted reply"
        style={styles.replyDismissBtn}
      >
        <Ionicons name="close-circle" size={20} color={placeholderColor} />
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  replyContentCol: {
    flex: 1,
    marginRight: 8,
  },
  replyAuthorText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  replySnippetText: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  replyDismissBtn: {
    padding: 4,
  },
});
