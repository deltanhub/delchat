import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AssignedAgentCardData } from './types';
import { styles } from './styles';

interface AgentCardActionButtonsProps {
  card: AssignedAgentCardData;
  borderColor: string;
  textColor: string;
  isDark: boolean;
  onReportAgent?: (card: AssignedAgentCardData) => void;
}

export default function AgentCardActionButtons({
  card,
  borderColor,
  textColor,
  isDark,
  onReportAgent,
}: AgentCardActionButtonsProps) {
  const router = useRouter();

  return (
    <View style={styles.agentCardBtnRow}>
      <Pressable
        onPress={() => router.push(`/agent/${card.agent.userId}` as Href)}
        style={({ pressed }) => [
          styles.agentCardBtn,
          {
            flex: onReportAgent ? 1 : undefined,
            borderColor: isDark ? '#3f3f46' : borderColor,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Text style={[styles.agentCardBtnText, { color: textColor }]}>View Profile</Text>
      </Pressable>

      {onReportAgent && (
        <Pressable
          onPress={() => onReportAgent(card)}
          style={({ pressed }) => [
            styles.agentCardReportBtn,
            {
              borderColor: isDark ? '#3d1624' : '#fecaca',
              backgroundColor: isDark ? '#261219' : '#fff5f5',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Report agent"
        >
          <Ionicons name="flag-outline" size={13} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.agentCardReportBtnText}>Report</Text>
        </Pressable>
      )}
    </View>
  );
}
