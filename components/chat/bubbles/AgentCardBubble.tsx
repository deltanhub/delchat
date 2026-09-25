import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';
import {
  AssignedAgentCardData,
  parseAssignedAgentCard,
  styles,
  AgentCardContactBox,
  AgentCardActionButtons,
} from './agent_card';

export interface AgentCardBubbleProps {
  card: AssignedAgentCardData;
  message: ChatMessage;
  isStarred?: boolean;
  onReportAgent?: (card: AssignedAgentCardData) => void;
}

export { AssignedAgentCardData, parseAssignedAgentCard };

export default function AgentCardBubble({
  card,
  message,
  isStarred = false,
  onReportAgent,
}: AgentCardBubbleProps) {
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

        <AgentCardContactBox
          card={card}
          textColor={colors.text}
          placeholderColor={colors.placeholder}
        />

        {/* Action Buttons: View Profile & Report (flag-outline) */}
        <AgentCardActionButtons
          card={card}
          borderColor={colors.border}
          textColor={colors.text}
          isDark={isDark}
          onReportAgent={onReportAgent}
        />

        <View style={styles.timeRow}>
          {isStarred && <Ionicons name="star" size={11} color="#f59e0b" />}
          <Text style={[styles.agentCardTime, { color: colors.placeholder }]}>
            {formatMsgTime(message.sentAt)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
