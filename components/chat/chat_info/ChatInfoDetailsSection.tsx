import React from 'react';
import { View, Text } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ChatInfoDetailsSectionProps } from './types';

export const ChatInfoDetailsSection: React.FC<ChatInfoDetailsSectionProps> = ({
  conversation,
  messagesCount,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>
        CONVERSATION DETAILS
      </Text>

      <View style={styles.metaRow}>
        <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
          Total Messages
        </Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>
          {messagesCount}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
          Last Activity
        </Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>
          {conversation.updatedAt
            ? new Date(conversation.updatedAt).toLocaleString()
            : 'Recent'}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
          Channel Type
        </Text>
        <Text
          style={[
            styles.metaValue,
            { color: colors.primary, fontWeight: '600' },
          ]}
        >
          {conversation.conversationKind === 'listing_human'
            ? 'Listing Inquiry'
            : 'Direct Message'}
        </Text>
      </View>
    </View>
  );
};
