import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';

export interface ChatParticipant {
  userId: string | null;
  fullName: string;
  avatarUrl: string | null;
  participantRole: string;
}

export interface ChatConversation {
  id: string;
  conversationKind: 'listing_human' | 'assistant' | 'support' | 'direct' | 'broadcast' | 'group' | string;
  title?: string;
  preview: string;
  updatedAt: string | null;
  unreadCount: number;
  latestIntent?: 'tour' | 'question' | 'availability' | 'valuation' | 'general' | null;
  partnerName: string;
  partnerSubtitle?: string;
  partnerAvatarUrl: string | null;
  partnerUserId?: string | null;
  partnerLastSeenAt?: string | null;
  isGroup?: boolean;
  participantCount?: number;
  assigned_to_user_id?: string | null;
  listing?: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null;
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  pinnedAt?: string | null;
  isBlocked?: boolean;
  blockedByMe?: boolean;
  canAssignAgents?: boolean;
  assignment?: {
    id?: string;
    inquiryId?: string;
    leadId?: string;
    status?: string;
    assignedAgentUserId?: string | null;
    assignedAgentName?: string | null;
    assignedAgentAvatar?: string | null;
    assignedByUserId?: string | null;
    assignedAt?: string | null;
    masterLeadStatus?: string;
    handoffNote?: string | null;
    agentShareEnabled?: boolean;
    agencyUserId?: string | null;
    agent?: {
      userId: string;
      fullName: string;
      avatarUrl: string | null;
      email?: string;
      phone?: string;
    } | null;
  } | null;
}

interface ConversationRowProps {
  conversation: ChatConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onLongPress?: (conversation: ChatConversation) => void;
}

export default function ConversationRow({
  conversation,
  isActive,
  onSelect,
  onLongPress,
}: ConversationRowProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Format timestamp
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const now = new Date();
      
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const containerBg = isActive
    ? isDark ? '#350a13' : '#fcf2f5'
    : conversation.listing
      ? isDark ? '#160307' : '#fffcfd'
      : isDark ? '#121212' : '#f8fbfe';

  const borderBottomColor = isDark ? '#262626' : '#e7edf3';

  const listingTitle = conversation.conversationKind === 'direct'
    ? conversation.partnerSubtitle
    : conversation.listing?.title ?? conversation.title;

  const intentBadgeLabel = conversation.latestIntent && conversation.latestIntent !== 'general'
    ? conversation.latestIntent === 'tour'
      ? 'TOUR'
      : conversation.latestIntent.toUpperCase()
    : null;

  return (
    <ScalePressable
      onPress={() => onSelect(conversation.id)}
      onLongPress={() => onLongPress?.(conversation)}
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          borderBottomColor: borderBottomColor,
        },
      ]}
    >
      {/* Avatar column */}
      <View style={styles.avatarContainer}>
        {conversation.partnerAvatarUrl ? (
          <Image
            source={{ uri: conversation.partnerAvatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}>
            <Text style={[styles.avatarFallbackText, { color: isDark ? '#ffffff' : colors.primary }]}>
              {getInitials(conversation.partnerName)}
            </Text>
          </View>
        )}
        
        {/* Unread indicator dot */}
        {conversation.unreadCount > 0 && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary, borderColor: containerBg }]} />
        )}
      </View>

      {/* Details column (3 Rows) */}
      <View style={styles.detailsContainer}>
        {/* Row 1: Name and Time */}
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, marginRight: 6 }}>
            <Text
              style={[
                styles.partnerName,
                { color: colors.text, fontWeight: conversation.unreadCount > 0 ? '700' : '600' },
              ]}
              numberOfLines={1}
            >
              {conversation.partnerName}
            </Text>
            {(conversation.conversationKind === 'broadcast' ||
              conversation.partnerName.toUpperCase() === 'DELTANHUB' ||
              conversation.partnerName.toUpperCase() === 'DELTANHUB SUPPORT') && (
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={9} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {conversation.isPinned && (
              <Ionicons name="pin" size={13} color="#f59e0b" style={{ transform: [{ rotate: '45deg' }] }} />
            )}
            {conversation.isMuted && (
              <Ionicons name="notifications-off-outline" size={13} color={colors.placeholder} />
            )}
            <Text style={[styles.timeText, { color: colors.placeholder }]}>
              {formatTime(conversation.updatedAt)}
            </Text>
          </View>
        </View>

        {/* Row 2: Property listing context and Intent Badge */}
        <View style={styles.row}>
          <Text
            style={[
              styles.listingTitle,
              { color: isDark ? '#9ca3af' : '#435977' },
            ]}
            numberOfLines={1}
          >
            {listingTitle}
          </Text>
          {intentBadgeLabel && (
            <View style={[styles.intentBadge, { backgroundColor: isDark ? '#2c0810' : '#f2dfe6' }]}>
              <Text style={[styles.intentBadgeText, { color: isDark ? '#ffffff' : colors.primary }]}>
                {intentBadgeLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Optional Row: Lead Assignment & Status Badge */}
        {conversation.assignment && (
          <View style={[styles.row, { marginTop: 3 }]}>
            <View
              style={[
                styles.leadBadge,
                {
                  backgroundColor: isDark ? '#1a2942' : '#eff6ff',
                  borderColor: isDark ? '#2563eb' : '#bfdbfe',
                },
              ]}
            >
              <Ionicons name="briefcase-outline" size={11} color="#2563eb" style={{ marginRight: 3 }} />
              <Text style={styles.leadBadgeText}>
                {conversation.canAssignAgents ? 'Master Lead' : 'Assigned Lead'}:{' '}
                <Text style={{ fontWeight: '700' }}>
                  {(conversation.assignment.masterLeadStatus || 'new').toUpperCase()}
                </Text>
              </Text>
            </View>

            {conversation.assignment.agent?.fullName && conversation.assignment.agent.fullName !== 'Unassigned' ? (
              <View style={[styles.agentChip, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}>
                <Ionicons name="person-circle-outline" size={12} color={colors.placeholder} style={{ marginRight: 3 }} />
                <Text style={[styles.agentChipText, { color: colors.placeholder }]} numberOfLines={1}>
                  {conversation.assignment.agent.fullName}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Row 3: Preview text and Unread Badge */}
        <View style={styles.row}>
          <Text
            style={[
              styles.previewText,
              {
                color: conversation.unreadCount > 0 ? colors.text : colors.placeholder,
                fontWeight: conversation.unreadCount > 0 ? '500' : '400',
              },
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
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  detailsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  partnerName: {
    fontSize: 15,
    fontFamily: Typography.fontFamily,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  listingTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
    flex: 1,
  },
  previewText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    lineHeight: 18,
    flex: 1,
  },
  intentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  intentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  leadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  leadBadgeText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '500',
  },
  agentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140,
  },
  agentChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
