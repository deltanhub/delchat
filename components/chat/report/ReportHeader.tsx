import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface ReportHeaderProps {
  targetName: string;
  agencyName?: string | null;
  isAssignedAgentReport?: boolean;
  colors: { text: string; placeholder: string };
  onClose: () => void;
}

export function ReportHeader({
  targetName,
  agencyName,
  isAssignedAgentReport,
  colors,
  onClose,
}: ReportHeaderProps) {
  const isAgentReport = Boolean(isAssignedAgentReport || agencyName);

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isAgentReport ? 'Report Agent' : 'Report Conversation'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]} numberOfLines={2}>
          {isAgentReport
            ? `Report ${targetName} to ${agencyName || 'supervising firm'} management`
            : `Report ${targetName} for moderation review`}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}
