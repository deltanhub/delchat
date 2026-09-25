import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';

export interface ThreadBlockedOrPrivateComposerBarProps {
  isBlocked: boolean;
  blockedByMe?: boolean;
  isPrivateAgentChat: boolean;
  assignedAgentName?: string;
  isDark: boolean;
}

export function ThreadBlockedOrPrivateComposerBar({
  isBlocked,
  blockedByMe = false,
  isPrivateAgentChat,
  assignedAgentName = 'agent',
  isDark,
}: ThreadBlockedOrPrivateComposerBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 14);

  if (isBlocked) {
    return (
      <View
        style={[
          styles.privacyComposerBar,
          {
            backgroundColor: isDark ? '#1a1012' : '#fef2f2',
            borderTopColor: isDark ? '#7f1d1d' : '#fecaca',
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <Ionicons
          name="ban"
          size={15}
          color={isDark ? '#f87171' : '#dc2626'}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.privacyComposerText,
            { color: isDark ? '#fca5a5' : '#b91c1c' },
          ]}
        >
          {blockedByMe
            ? 'You have blocked this contact. Tap menu to unblock.'
            : 'This contact is currently unavailable for direct messages.'}
        </Text>
      </View>
    );
  }

  if (isPrivateAgentChat) {
    return (
      <View
        style={[
          styles.privacyComposerBar,
          {
            backgroundColor: isDark ? '#1a0d13' : '#fdf6f8',
            borderTopColor: isDark ? '#4a0f1f' : '#efe3e8',
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <Ionicons
          name="lock-closed"
          size={14}
          color={isDark ? '#f4a5b8' : '#4a0f1f'}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.privacyComposerText,
            { color: isDark ? '#f4a5b8' : '#5f5360' },
          ]}
        >
          Private agent thread · Delegated to {assignedAgentName}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  privacyComposerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  privacyComposerText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});
