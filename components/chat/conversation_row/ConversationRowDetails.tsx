import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import { formatConversationTime } from './timeHelpers';
import { ConversationLeadBadge } from './ConversationLeadBadge';
import type { ConversationRowDetailsProps } from './types';

export const ConversationRowDetails: React.FC<ConversationRowDetailsProps> = ({
  conversation,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const listingTitle =
    conversation.conversationKind === 'direct'
      ? conversation.partnerSubtitle
      : conversation.listing?.title ?? conversation.title;

  const intentBadgeLabel =
    conversation.latestIntent && conversation.latestIntent !== 'general'
      ? conversation.latestIntent === 'tour'
        ? 'TOUR'
        : conversation.latestIntent.toUpperCase()
      : null;

  const formattedTime = formatConversationTime(conversation.updatedAt);

  const isVerifiedHub =
    conversation.conversationKind === 'broadcast' ||
    conversation.partnerName.toUpperCase() === 'DELTANHUB' ||
    conversation.partnerName.toUpperCase() === 'DELTANHUB SUPPORT';

  return (
    <View style={styles.detailsContainer}>
      {/* Row 1: Name and Time */}
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, marginRight: 6 }}>
          <Text
            style={[styles.partnerName, { color: colors.text, fontWeight: conversation.unreadCount > 0 ? '700' : '600' }]}
            numberOfLines={1}
          >
            {conversation.partnerName}
          </Text>
          {isVerifiedHub && (
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={9} color="#ffffff" />
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {conversation.isPinned && <Ionicons name="pin" size={13} color="#f59e0b" style={{ transform: [{ rotate: '45deg' }] }} />}
          {conversation.isFavorited && <Ionicons name="heart" size={12} color="#ff2d55" />}
          {conversation.isMuted && <Ionicons name="notifications-off-outline" size={13} color={colors.placeholder} />}
          <Text style={[styles.timeText, { color: colors.placeholder }]}>{formattedTime}</Text>
        </View>
      </View>

      {/* Row 2: Property listing context and Intent Badge */}
      <View style={styles.row}>
        <Text style={[styles.listingTitle, { color: isDark ? '#9ca3af' : '#435977' }]} numberOfLines={1}>
          {listingTitle}
        </Text>
        {intentBadgeLabel && (
          <View style={[styles.intentBadge, { backgroundColor: isDark ? '#2c0810' : '#f2dfe6' }]}>
            <Text style={[styles.intentBadgeText, { color: isDark ? '#ffffff' : colors.primary }]}>{intentBadgeLabel}</Text>
          </View>
        )}
      </View>

      {/* Optional Row: Lead Assignment & Status Badge */}
      <ConversationLeadBadge conversation={conversation} isDark={isDark} />

      {/* Row 3: Preview text and Unread Badge */}
      <View style={styles.row}>
        <Text
          style={[
            styles.previewText,
            { color: conversation.unreadCount > 0 ? colors.text : colors.placeholder, fontWeight: conversation.unreadCount > 0 ? '500' : '400' },
          ]}
          numberOfLines={1}
        >
          {conversation.preview}
        </Text>
        {conversation.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
