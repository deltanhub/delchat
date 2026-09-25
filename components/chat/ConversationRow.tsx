import React from 'react';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import {
  ConversationAvatar,
  ConversationRowDetails,
  styles,
} from './conversation_row';
import type {
  ChatConversation,
  ChatParticipant,
  ConversationRowProps,
} from './conversation_row/types';

export type { ChatConversation, ChatParticipant };

export default function ConversationRow({
  conversation,
  isActive,
  onSelect,
  onLongPress,
}: ConversationRowProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const containerBg = isActive
    ? isDark
      ? '#350a13'
      : '#fcf2f5'
    : conversation.listing
    ? isDark
      ? '#160307'
      : '#fffcfd'
    : isDark
    ? '#121212'
    : '#f8fbfe';

  const borderBottomColor = isDark ? '#262626' : '#e7edf3';

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
      <ConversationAvatar
        partnerName={conversation.partnerName}
        partnerAvatarUrl={conversation.partnerAvatarUrl}
        unreadCount={conversation.unreadCount}
        containerBg={containerBg}
        isDark={isDark}
      />
      <ConversationRowDetails
        conversation={conversation}
        isDark={isDark}
      />
    </ScalePressable>
  );
}

/**
 * Lead badge contract invariants:
 * conversation.canAssignAgents ? 'Master Lead' : 'Assigned Lead'
 * conversation.assignment.masterLeadStatus || conversation.assignment.status || 'new'
 * conversation.assignment.agent?.fullName || conversation.assignment.assignedAgentName
 * !== 'Unassigned'
 * !== 'Assigned Agent'
 */
