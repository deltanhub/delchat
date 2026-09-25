import React from 'react';
import { View, Text, Image } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import { getInitials } from './timeHelpers';
import type { ConversationAvatarProps } from './types';

export const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  partnerName,
  partnerAvatarUrl,
  unreadCount,
  containerBg,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.avatarContainer}>
      {partnerAvatarUrl ? (
        <Image
          source={{ uri: partnerAvatarUrl }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            { backgroundColor: isDark ? '#262626' : colors.primarySoft },
          ]}
        >
          <Text
            style={[
              styles.avatarFallbackText,
              { color: isDark ? '#ffffff' : colors.primary },
            ]}
          >
            {getInitials(partnerName)}
          </Text>
        </View>
      )}

      {unreadCount > 0 && (
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: colors.primary, borderColor: containerBg },
          ]}
        />
      )}
    </View>
  );
};
