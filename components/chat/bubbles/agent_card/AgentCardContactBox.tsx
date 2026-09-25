import React from 'react';
import { View, Text } from 'react-native';
import { AssignedAgentCardData } from './types';
import { styles } from './styles';

interface AgentCardContactBoxProps {
  card: AssignedAgentCardData;
  textColor: string;
  placeholderColor: string;
}

export default function AgentCardContactBox({
  card,
  textColor,
  placeholderColor,
}: AgentCardContactBoxProps) {
  return (
    <View style={styles.agentCardContactBox}>
      {card.agent.email && (
        <Text style={[styles.agentCardContactText, { color: textColor }]}>
          ✉️  {card.agent.email}
        </Text>
      )}
      {card.agent.phone && (
        <Text style={[styles.agentCardContactText, { color: textColor }]}>
          📞  {card.agent.phone}
        </Text>
      )}
      {card.assignedByName && (
        <Text style={[styles.agentCardAssignedBy, { color: placeholderColor }]}>
          Assigned by {card.assignedByName}
        </Text>
      )}
    </View>
  );
}
