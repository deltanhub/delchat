import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComposerDisabledBannerProps } from './types';

export function ComposerDisabledBanner({
  isDark,
  borderColor,
  bottomPadding,
  disabledNotice,
}: ComposerDisabledBannerProps) {
  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderTopColor: isDark ? '#27272a' : borderColor,
          backgroundColor: isDark ? '#18181b' : '#f8fbfe',
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.megaphoneCircle}>
          <Ionicons name="megaphone" size={10} color="#ffffff" />
        </View>
        <Text
          style={[
            styles.noticeText,
            { color: isDark ? '#a1a1aa' : '#5c7089' },
          ]}
        >
          {disabledNotice ||
            'This is an official announcement channel from DELTANHUB. Replies are disabled.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
  },
  megaphoneCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5C1324',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
