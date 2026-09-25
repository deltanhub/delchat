import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import * as Haptics from '../../../lib/haptics';
import { BrokerageAgent } from '../../../lib/repositories';

export interface AssignmentAgentCardProps {
  agent: BrokerageAgent;
  isSelected: boolean;
  isCurrent: boolean;
  colors: any;
  isDark: boolean;
  onSelect: (userId: string) => void;
}

export default function AssignmentAgentCard({
  agent,
  isSelected,
  isCurrent,
  colors,
  isDark,
  onSelect,
}: AssignmentAgentCardProps) {
  return (
    <ScalePressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(agent.userId);
      }}
      style={[
        styles.agentCard,
        {
          backgroundColor: isSelected
            ? isDark ? '#3a0b18' : colors.primarySoft
            : isDark ? '#18181b' : '#ffffff',
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.agentRow}>
        {agent.avatarUrl ? (
          <Image source={{ uri: agent.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {agent.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.agentInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.agentName, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {agent.name}
            </Text>
            <View
              style={[
                styles.agentTypeBadge,
                {
                  backgroundColor: agent.agentType === 'external'
                    ? isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'
                    : isDark ? 'rgba(74, 15, 31, 0.25)' : '#fcedf2',
                  borderColor: agent.agentType === 'external'
                    ? isDark ? '#1d4ed8' : '#bfdbfe'
                    : isDark ? '#5c1d29' : '#fecdd3',
                },
              ]}
            >
              <Text
                style={[
                  styles.agentTypeBadgeText,
                  { color: agent.agentType === 'external' ? (isDark ? '#93c5fd' : '#2563eb') : colors.primary },
                ]}
              >
                {agent.agentType === 'external' ? 'EXTERNAL' : 'INTERNAL'}
              </Text>
            </View>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: isDark ? '#27272a' : '#e2e8f0' }]}>
                <Text style={[styles.currentBadgeText, { color: colors.placeholder }]}>Current</Text>
              </View>
            )}
          </View>
          <Text style={[styles.agentRole, { color: colors.placeholder }]}>
            {agent.role} {agent.email ? `• ${agent.email}` : ''}
          </Text>
        </View>

        <View
          style={[
            styles.radioCircle,
            { borderColor: isSelected ? colors.primary : colors.placeholder },
            isSelected && { backgroundColor: colors.primary },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={13} color="#ffffff" />}
        </View>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  agentCard: { borderRadius: 14, borderWidth: 1, padding: 12 },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarInitials: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  agentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  agentName: { fontSize: 15, fontWeight: '600' },
  agentTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  agentTypeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  currentBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  currentBadgeText: { fontSize: 10, fontWeight: '600' },
  agentRole: { fontSize: 12, marginTop: 2 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
