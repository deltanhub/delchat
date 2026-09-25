import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './historyStyles';
import type { AssignmentHistoryItem, PublicUserProfile } from './types';
import type { ChatConversation } from '../ConversationRow';

export interface MasterLeadHistoryViewProps {
  history: AssignmentHistoryItem[];
  historyProfiles: Map<string, PublicUserProfile>;
  loadingHistory: boolean;
  currentUserId: string | null;
  conversation: ChatConversation;
  colors: any;
  isDark: boolean;
}

export default function MasterLeadHistoryView({
  history,
  historyProfiles,
  loadingHistory,
  currentUserId,
  conversation,
  colors,
  isDark,
}: MasterLeadHistoryViewProps) {
  const assignment = conversation.assignment;
  const assignedDate = assignment?.assignedAt
    ? new Date(assignment.assignedAt).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Initial creation';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          ASSIGNMENT HISTORY {history.length > 0 ? `(${history.length})` : ''}
        </Text>

        {loadingHistory ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : history.length > 0 ? (
          <View style={{ marginTop: 4, paddingLeft: 4 }}>
            {history.map((h, idx) => {
              const agentProfile = historyProfiles.get(h.assigned_agent_user_id || '');
              const byProfile = historyProfiles.get(h.assigned_by_user_id || '');
              const agentName = agentProfile
                ? (agentProfile.display_name?.trim() || agentProfile.full_name?.trim() || 'Agent')
                : (assignment?.agent?.fullName || assignment?.assignedAgentName || 'Assigned Agent');
              const byName = byProfile
                ? (byProfile.display_name?.trim() || byProfile.full_name?.trim() || 'Manager')
                : (h.assigned_by_user_id === currentUserId ? 'You' : 'Manager');

              let title = '';
              if (h.action_kind === 'assigned' || h.action_kind === 'assign') {
                title = `Assigned to ${agentName}`;
              } else if (h.action_kind === 'reassigned' || h.action_kind === 'reassign') {
                title = `Reassigned to ${agentName}`;
              } else if (h.action_kind === 'status_changed') {
                title = 'Status updated';
              } else {
                title = 'Assignment removed';
              }

              const isLast = idx === history.length - 1;

              return (
                <View key={h.id} style={styles.timelineItemRow}>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineConnector,
                        { backgroundColor: isDark ? '#3d1624' : '#efe3e8' },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.primary, borderColor: colors.card },
                    ]}
                  />
                  <View style={{ flex: 1, paddingBottom: 16 }}>
                    <Text style={[styles.metricSub, { color: colors.placeholder, fontSize: 11 }]}>
                      {new Date(h.created_at).toLocaleString([], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={[styles.dataValue, { color: colors.text, fontWeight: '600', marginTop: 2 }]}>
                      {title}
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.placeholder, marginTop: 2 }]}>
                      by {byName} {h.note ? `· note: "${h.note}"` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : assignment?.agent || assignment?.assignedAgentName ? (
          <View style={styles.historyItem}>
            <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {`Assigned to ${assignment.agent?.fullName || assignment.assignedAgentName}`}
              </Text>
              <Text style={[styles.metricSub, { color: colors.placeholder }]}>{assignedDate}</Text>
              {assignment?.handoffNote && (
                <Text style={[styles.handoffText, { color: colors.placeholder, marginTop: 4 }]}>
                  Note: "{assignment.handoffNote}"
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Ionicons name="time-outline" size={32} color={colors.placeholder} />
            <Text style={{ fontSize: 13, color: colors.placeholder, marginTop: 6, fontStyle: 'italic' }}>
              No assignment logs found.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
