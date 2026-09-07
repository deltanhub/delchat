import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import Pressable from '../../ScalePressable';
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
        {/* Status Pill */}
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.placeholder }]}>STATUS</Text>
          <Pressable
            onPress={onPressStatus}
            style={[
              styles.pill,
              {
                backgroundColor: isDark ? '#2c0810' : '#fdf2f4',
                borderColor: isDark ? '#4a0f1f' : '#efe3e8',
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: isDark ? '#f4a5b8' : colors.primary }]} />
            <Text style={[styles.pillText, { color: isDark ? '#ffffff' : '#4a0f1f' }]} numberOfLines={1}>
              {status}
            </Text>
            <Ionicons name="chevron-down" size={12} color={isDark ? '#ffffff' : '#4a0f1f'} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* Assigned Agent Pill */}
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.placeholder }]}>ASSIGNED AGENT</Text>
          <Pressable
            onPress={onPressAgent}
            style={[
              styles.pill,
              {
                backgroundColor: isDark ? '#1c1c1e' : '#fdf2f4',
                borderColor: isDark ? '#2c2c2e' : '#efe3e8',
              },
            ]}
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
              style={[
                styles.tabBtn,
                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: isActive ? colors.primary : colors.placeholder,
                    fontWeight: isActive ? '700' : '500',
                  },
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

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    flex: 1,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  handoffBox: {
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  handoffTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  handoffText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    lineHeight: 16,
  },
  tabsRow: {
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  tabBtn: {
    paddingVertical: 8,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
});
