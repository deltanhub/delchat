import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import { ChatListingInfoColProps } from './types';

export const ChatListingInfoCol: React.FC<ChatListingInfoColProps> = ({
  title,
  listingMeta,
  statusBadgeConfig,
  isDark,
}) => {
  return (
    <View style={styles.infoCol}>
      <View style={styles.tagRow}>
        <Text style={[styles.tagText, { color: isDark ? '#f4a5b8' : '#be123c' }]}>
          LINKED LISTING
        </Text>
        {statusBadgeConfig ? (
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeConfig.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusBadgeConfig.text }]}>
              {statusBadgeConfig.label}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.titleText, { color: isDark ? '#ffffff' : '#10243a' }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {listingMeta ? (
        <Text
          style={[styles.metaText, { color: isDark ? '#9ca3af' : '#60748c' }]}
          numberOfLines={1}
        >
          {listingMeta}
        </Text>
      ) : null}
    </View>
  );
};
