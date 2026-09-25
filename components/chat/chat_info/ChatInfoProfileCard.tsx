import React from 'react';
import { View, Text, Image } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ChatInfoProfileCardProps } from './types';

const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const ChatInfoProfileCard: React.FC<ChatInfoProfileCardProps> = ({
  conversation,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.profileCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <View style={styles.avatarRow}>
        {conversation.partnerAvatarUrl ? (
          <Image
            source={{ uri: conversation.partnerAvatarUrl }}
            style={styles.avatarImg}
          />
        ) : (
          <View
            style={[
              styles.avatarInitials,
              { backgroundColor: isDark ? '#262626' : colors.primarySoft },
            ]}
          >
            <Text
              style={[
                styles.avatarInitialsText,
                { color: isDark ? '#ffffff' : colors.primary },
              ]}
            >
              {getInitials(conversation.partnerName)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.partnerName, { color: colors.text }]}>
            {conversation.partnerName}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Text
                style={[styles.roleBadgeText, { color: colors.primary }]}
              >
                {conversation.conversationKind === 'listing_human'
                  ? 'Listing Inquiry'
                  : 'Direct Contact'}
              </Text>
            </View>
            {conversation.isArchived && (
              <View
                style={[styles.roleBadge, { backgroundColor: '#fef3c7' }]}
              >
                <Text style={[styles.roleBadgeText, { color: '#d97706' }]}>
                  Archived
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
