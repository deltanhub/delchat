import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import { InquiryResponseAnswersList } from './InquiryResponseAnswersList';
import type { InquiryResponseCardProps } from './types';

export const InquiryResponseCard: React.FC<InquiryResponseCardProps> = ({
  item,
  isDark,
  onOpenChat,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isTour = item.intentTrigger === 'tour';

  const initials = item.senderName
    ? item.senderName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? '#27272a' : colors.border,
        },
      ]}
    >
      {/* Header: User initials, Name, Date, and Open in Chat button */}
      <View style={styles.cardHeader}>
        <View style={styles.userRow}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: isTour ? '#1e3a8a' : colors.primary },
            ]}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
              {item.senderName}
            </Text>
            <Text style={[styles.dateText, { color: colors.placeholder }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <ScalePressable
          onPress={() => onOpenChat(item.conversationId)}
          style={[styles.openChatBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
          <Text style={[styles.openChatBtnText, { color: colors.primary }]}>Open Chat</Text>
        </ScalePressable>
      </View>

      {/* Trigger Badge & Listing Info */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.triggerBadge,
            {
              backgroundColor: isTour
                ? isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe'
                : isDark ? 'rgba(74, 15, 31, 0.25)' : '#fdf6f8',
            },
          ]}
        >
          <Text
            style={[
              styles.triggerBadgeText,
              { color: isTour ? (isDark ? '#60a5fa' : '#1d4ed8') : colors.primary },
            ]}
          >
            {isTour ? 'Trigger: Request a Tour' : 'Trigger: Ask a Question'}
          </Text>
        </View>
        {item.listingTitle && (
          <View
            style={[
              styles.listingPill,
              { backgroundColor: isDark ? '#1f2937' : '#f0e5e9' },
            ]}
          >
            <Ionicons name="home-outline" size={11} color={colors.primary} />
            <Text
              style={[styles.listingPillText, { color: colors.primary }]}
              numberOfLines={1}
            >
              {item.listingTitle}
            </Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? '#27272a' : '#f0e5e9' }]} />

      {/* Answers List */}
      <InquiryResponseAnswersList
        answers={item.answers}
        isDark={isDark}
        colors={colors}
      />
    </View>
  );
};
