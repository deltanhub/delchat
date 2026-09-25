import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { ArchivedInfoBannerProps } from './types';

export function ArchivedInfoBanner({
  colors,
  isDark,
}: ArchivedInfoBannerProps) {
  return (
    <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1a1a1a' : '#f0f4f9' }]}>
      <Ionicons name="information-circle-outline" size={16} color={colors.placeholder} style={{ marginRight: 8 }} />
      <Text style={[styles.infoBannerText, { color: colors.placeholder }]}>
        These chats stay archived when new messages are received.
      </Text>
    </View>
  );
}

export default ArchivedInfoBanner;
