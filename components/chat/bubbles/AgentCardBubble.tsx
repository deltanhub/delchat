import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';

export interface AssignedAgentCardData {
  actionLabel: string;
  agencyName: string | null;
  assignedByName: string | null;
  agent: {
    userId: string;
    fullName: string;
    subtitle: string;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
    profileHref: string;
  };
}

export function parseAssignedAgentCard(message: ChatMessage): AssignedAgentCardData | null {
  const payload = message.structuredPayload;
  if (!payload && message.messageKind !== 'agent_card') {
    return null;
  }

  if (payload?.card_kind === 'assigned_agent') {
    const agent = payload.agent || {};
    return {
      actionLabel: payload.actionLabel || 'assigned',
      agencyName: payload.agencyName || null,
      assignedByName: payload.assignedByName || null,
      agent: {
        userId: agent.userId || '',
        fullName: agent.fullName || 'Assigned Agent',
        subtitle: agent.subtitle || 'Assigned agent',
        avatarUrl: agent.avatarUrl || null,
        email: agent.email || null,
        phone: agent.phone || null,
        profileHref: agent.profileHref || `/agents/${agent.userId}`,
      },
    };
  }

  if (payload?.agentCard || message.messageKind === 'agent_card') {
    const agent = payload?.agentCard || {};
    return {
      actionLabel: agent.actionLabel || 'assigned',
      agencyName: agent.agencyName || null,
      assignedByName: agent.assignedBy || null,
      agent: {
        userId: agent.agentUserId || agent.userId || '',
        fullName: agent.agentName || agent.fullName || 'Assigned Agent',
        subtitle: agent.agentRole || agent.subtitle || 'Assigned agent',
        avatarUrl: agent.agentAvatar || agent.avatarUrl || null,
        email: agent.agentEmail || agent.email || null,
        phone: agent.agentPhone || agent.phone || null,
        profileHref: `/agents/${agent.agentUserId || agent.userId}`,
      },
    };
  }

  return null;
}

interface AgentCardBubbleProps {
  card: AssignedAgentCardData;
  message: ChatMessage;
  isStarred?: boolean;
}

export default function AgentCardBubble({ card, message, isStarred = false }: AgentCardBubbleProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(14).mass(0.7)}
      layout={LinearTransition.springify().damping(14)}
      style={styles.agentCardOuter}
    >
      <View style={[styles.agentCardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.agentCardAction, { color: isDark ? '#ffffff' : colors.primary }]}>
          {card.actionLabel === 'reassigned' ? 'Agent updated' : 'Agent introduced'}
        </Text>
        <Text style={[styles.agentCardName, { color: colors.text }]}>
          {card.agent.fullName}
        </Text>
        <Text style={[styles.agentCardSubtitle, { color: colors.placeholder }]}>
          {card.agent.subtitle}
        </Text>

        <Text style={[styles.agentCardDescription, { color: isDark ? '#d1d5db' : '#5f6f83' }]}>
          {card.agencyName ?? 'The agency'} added this agent to the thread so the buyer can review the profile and continue the conversation before direct outreach.
        </Text>

        <View style={styles.agentCardContactBox}>
          {card.agent.email && (
            <Text style={[styles.agentCardContactText, { color: colors.text }]}>
              ✉️  {card.agent.email}
            </Text>
          )}
          {card.agent.phone && (
            <Text style={[styles.agentCardContactText, { color: colors.text }]}>
              📞  {card.agent.phone}
            </Text>
          )}
          {card.assignedByName && (
            <Text style={[styles.agentCardAssignedBy, { color: colors.placeholder }]}>
              Assigned by {card.assignedByName}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push(`/agent/${card.agent.userId}` as Href)}
          style={({ pressed }) => [
            styles.agentCardBtn,
            {
              borderColor: isDark ? '#3f3f46' : colors.border,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.agentCardBtnText, { color: colors.text }]}>View Profile</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 3 }}>
          {isStarred && (
            <Ionicons name="star" size={11} color="#f59e0b" />
          )}
          <Text style={[styles.agentCardTime, { color: colors.placeholder }]}>
            {formatMsgTime(message.sentAt)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  agentCardOuter: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  agentCardContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  agentCardAction: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  agentCardName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: Typography.fontFamily,
  },
  agentCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  agentCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    fontFamily: Typography.fontFamily,
  },
  agentCardContactBox: {
    marginTop: 16,
    gap: 6,
  },
  agentCardContactText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  agentCardAssignedBy: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  agentCardBtn: {
    marginTop: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  agentCardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  agentCardTime: {
    fontSize: 10,
    marginTop: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
