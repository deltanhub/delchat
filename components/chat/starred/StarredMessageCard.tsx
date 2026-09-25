import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import * as Haptics from '../../../lib/haptics';
import { StarredMessageCardProps } from './types';
import StarredMediaBadge from './StarredMediaBadge';
import { cardStyles } from './cardStyles';

export default function StarredMessageCard({
  item,
  scope,
  isDark,
  colors,
  onUnstar,
  onJumpToMessage,
  onClose,
}: StarredMessageCardProps) {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          borderColor: isDark ? '#27272a' : '#e4e4e7',
        },
      ]}
    >
      {/* Top Row: Sender, Conversation Title, Date, Unstar Button */}
      <View style={cardStyles.cardTopRow}>
        <View style={cardStyles.senderInfo}>
          <Text style={[cardStyles.senderName, { color: colors.text }]} numberOfLines={1}>
            {item.senderName}
          </Text>
          {scope === 'all' && (
            <Text style={[cardStyles.conversationTitle, { color: colors.placeholder }]} numberOfLines={1}>
              {item.conversationTitle}
            </Text>
          )}
        </View>

        <View style={cardStyles.cardActions}>
          <Text style={[cardStyles.dateText, { color: colors.placeholder }]}>
            {formatDate(item.createdAt)}
          </Text>
          <TouchableOpacity
            onPress={() => onUnstar(item.messageId)}
            style={cardStyles.unstarBtn}
            accessibilityRole="button"
            accessibilityLabel="Unstar message"
            accessibilityHint="Removes this message from your favorites"
          >
            <Ionicons name="star" size={17} color="#f59e0b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message Body / Content Preview */}
      <View style={cardStyles.cardBody}>
        {item.body ? (
          <Text style={[cardStyles.bodyText, { color: colors.text }]} numberOfLines={4}>
            {item.body}
          </Text>
        ) : null}

        <StarredMediaBadge item={item} isDark={isDark} colors={colors} />
      </View>

      {/* Jump To Chat Action */}
      <View style={cardStyles.cardFooter}>
        <ScalePressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
            onJumpToMessage?.(item.messageId, item.conversationId);
          }}
          style={[
            cardStyles.jumpBtn,
            { backgroundColor: isDark ? '#27272a' : '#f4e7eb' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Jump to message in conversation"
        >
          <Text style={[cardStyles.jumpBtnText, { color: colors.primary }]}>
            Jump to chat
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </ScalePressable>
      </View>
    </View>
  );
}
