import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ThreadRateLimitBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View style={styles.rateLimitBanner}>
      <Ionicons
        name="hourglass-outline"
        size={14}
        color="#d97706"
        style={{ marginRight: 6 }}
      />
      <Text style={styles.rateLimitBannerText}>
        Sending slowed (rate limit reached) · Auto-retrying...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rateLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(245, 158, 11, 0.25)',
  },
  rateLimitBannerText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
  },
});
