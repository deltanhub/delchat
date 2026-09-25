import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ConversationLeadBadgeProps } from './types';

export const ConversationLeadBadge: React.FC<ConversationLeadBadgeProps> = ({
  conversation,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!conversation.assignment) return null;

  const agentName =
    conversation.assignment.agent?.fullName ||
    conversation.assignment.assignedAgentName;

  const showAgentChip =
    agentName &&
    agentName !== 'Unassigned' &&
    agentName !== 'Assigned Agent';

  return (
    <View style={[styles.row, { marginTop: 3 }]}>
      <View
        style={[
          styles.leadBadge,
          {
            backgroundColor: isDark ? '#2c0810' : '#fdf2f4',
            borderColor: isDark ? '#4a0f1f' : '#efe3e8',
          },
        ]}
      >
        <Ionicons
          name="briefcase"
          size={11}
          color={isDark ? '#f4a5b8' : '#4a0f1f'}
          style={{ marginRight: 3 }}
        />
        <Text
          style={[
            styles.leadBadgeText,
            { color: isDark ? '#f4a5b8' : '#4a0f1f' },
          ]}
        >
          {conversation.canAssignAgents ? 'Master Lead' : 'Assigned Lead'}:{' '}
          <Text style={{ fontWeight: '700' }}>
            {(
              conversation.assignment.masterLeadStatus ||
              conversation.assignment.status ||
              'new'
            ).toUpperCase()}
          </Text>
        </Text>
      </View>

      {showAgentChip ? (
        <View
          style={[
            styles.agentChip,
            { backgroundColor: isDark ? '#262626' : '#f3f4f6' },
          ]}
        >
          <Ionicons
            name="person-circle-outline"
            size={12}
            color={colors.placeholder}
            style={{ marginRight: 3 }}
          />
          <Text
            style={[styles.agentChipText, { color: colors.placeholder }]}
            numberOfLines={1}
          >
            {conversation.assignment.agent?.fullName ||
              conversation.assignment.assignedAgentName}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
