import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import Pressable from '../../ScalePressable';
import { styles } from './subHeaderStyles';
import type { ChatConversation } from '../ConversationRow';

export type MasterLeadSubTab = 'feed' | 'details' | 'notes' | 'history' | 'reports' | 'activity';

interface MasterLeadSubHeaderProps {
  conversation: ChatConversation;
  activeSubTab: MasterLeadSubTab;
  onChangeSubTab: (tab: MasterLeadSubTab) => void;
  onPressStatus: () => void;
  onPressAgent: () => void;
  notesCount?: number;
  reportsCount?: number;
}

export default function MasterLeadSubHeader({
  conversation,
  activeSubTab,
  onChangeSubTab,
  onPressStatus,
  onPressAgent,
  notesCount = 0,
  reportsCount = 0,
}: MasterLeadSubHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const assignment = conversation.assignment;
  const status = (assignment?.masterLeadStatus || assignment?.status || 'new').toUpperCase();
  const agentName = assignment?.agent?.fullName || assignment?.assignedAgentName || 'Unassigned';
  const agentInitials = agentName.substring(0, 2).toUpperCase();

  const tabs: Array<{ key: MasterLeadSubTab; label: string }> = [
    { key: 'feed', label: 'Conversations' },
    { key: 'details', label: 'Lead Summary' },
    { key: 'notes', label: notesCount > 0 ? `Notes (${notesCount})` : 'Notes' },
    { key: 'history', label: 'History' },
    { key: 'reports', label: reportsCount > 0 ? `Reports (${reportsCount})` : 'Reports' },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {/* Pills Row: Status & Agent */}
      <View style={styles.pillsRow}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.placeholder }]}>STATUS</Text>
          <Pressable
            onPress={onPressStatus}
            style={[styles.pill, { backgroundColor: isDark ? '#2c0810' : '#fdf2f4', borderColor: isDark ? '#4a0f1f' : '#efe3e8' }]}
          >
            <View style={[styles.statusDot, { backgroundColor: isDark ? '#f4a5b8' : colors.primary }]} />
            <Text style={[styles.pillText, { color: isDark ? '#ffffff' : '#4a0f1f' }]} numberOfLines={1}>
              {status}
            </Text>
            <Ionicons name="chevron-down" size={12} color={isDark ? '#ffffff' : '#4a0f1f'} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.placeholder }]}>ASSIGNED AGENT</Text>
          <Pressable
            onPress={onPressAgent}
            style={[styles.pill, { backgroundColor: isDark ? '#1c1c1e' : '#fdf2f4', borderColor: isDark ? '#2c2c2e' : '#efe3e8' }]}
          >
            <View style={[styles.avatar, { backgroundColor: isDark ? '#2c0810' : '#4a0f1f' }]}>
              <Text style={styles.avatarText}>{agentInitials}</Text>
            </View>
            <Text style={[styles.pillText, { color: isDark ? '#ffffff' : '#141c2b' }]} numberOfLines={1}>
              {agentName}
            </Text>
            <Ionicons name="chevron-down" size={12} color={isDark ? '#ffffff' : '#141c2b'} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>
      </View>

      {/* Handoff Note Box */}
      {assignment?.handoffNote ? (
        <View style={[styles.handoffBox, { backgroundColor: isDark ? '#1c1c1e' : '#fcf8fa', borderColor: isDark ? '#2c2c2e' : '#efe3e8' }]}>
          <Text style={[styles.handoffTitle, { color: isDark ? '#f4a5b8' : colors.primary }]}>🔑 Handoff Note:</Text>
          <Text style={[styles.handoffText, { color: colors.text }]}>"{assignment.handoffNote}"</Text>
        </View>
      ) : null}

      {/* Sub-tabs Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={[styles.tabsRow, { borderBottomColor: colors.border }]}
      >
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChangeSubTab(tab.key)}
              style={[styles.tabBtn, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isActive ? colors.primary : colors.placeholder, fontWeight: isActive ? '700' : '500' },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
