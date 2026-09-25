import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';
import * as Haptics from '../../../lib/haptics';
import { STATUS_PIPELINE } from './pipeline';

export interface AssignedLeadStripProps {
  assignment: {
    status?: string;
    agentShareEnabled?: boolean;
    handoffNote?: string | null;
    assignedAgentUserId?: string | null;
  };
  colors: any;
  isDark: boolean;
  onPressStatus: () => void;
  onOpenNotes: () => void;
  onToggleShare: () => void;
}

export function AssignedLeadStrip({
  assignment,
  colors,
  isDark,
  onPressStatus,
  onOpenNotes,
  onToggleShare,
}: AssignedLeadStripProps) {
  const currentAssignmentStatus = assignment.status;
  const normStatus =
    currentAssignmentStatus === 'closed'
      ? 'closed_won'
      : currentAssignmentStatus === 'lost'
      ? 'closed_lost'
      : currentAssignmentStatus;
  const statusMeta = STATUS_PIPELINE.find((s) => s.value === normStatus) || STATUS_PIPELINE[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.topRow}>
        {/* Quick Pipeline Status Pill */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPressStatus();
          }}
          style={[styles.statusBadge, { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
          <Text style={[styles.statusText, { color: statusMeta.color }]}>
            ASSIGNED LEAD: {statusMeta.label.toUpperCase()}
          </Text>
          <Ionicons name="chevron-down" size={11} color={statusMeta.color} style={{ marginLeft: 3 }} />
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <View style={[styles.assignedPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
            <Ionicons name="shield-checkmark" size={13} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.assignedPillText}>Assigned to You</Text>
          </View>

          {/* Confidential Lead Notes Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenNotes();
            }}
            style={[styles.notesIconBtn, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]}
            accessibilityLabel="Confidential internal notes"
          >
            <Ionicons name="lock-closed-outline" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Assigned Agent Share Control Row */}
      <TouchableOpacity
        onPress={onToggleShare}
        style={[
          styles.shareBanner,
          {
            backgroundColor: assignment.agentShareEnabled ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#1f2937' : '#f8fafc'),
            borderColor: assignment.agentShareEnabled ? '#10b981' : colors.border,
          },
        ]}
      >
        <Ionicons
          name={assignment.agentShareEnabled ? 'eye' : 'eye-off'}
          size={13}
          color={assignment.agentShareEnabled ? '#10b981' : colors.placeholder}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.shareText, { color: assignment.agentShareEnabled ? '#10b981' : colors.placeholder }]}>
          {assignment.agentShareEnabled
            ? 'Thread shared with Agency Principal'
            : 'Private thread (Tap to share with Agency)'}
        </Text>
      </TouchableOpacity>

      {/* Manager Handoff Note Box */}
      {assignment.handoffNote ? (
        <View style={[styles.handoffBox, { backgroundColor: isDark ? '#261a0f' : '#fffbeb', borderColor: isDark ? '#78350f' : '#fde68a' }]}>
          <Ionicons name="clipboard-outline" size={13} color="#d97706" style={{ marginRight: 6, marginTop: 1 }} />
          <Text style={[styles.handoffText, { color: isDark ? '#fde68a' : '#92400e' }]} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>Handoff: </Text>
            {assignment.handoffNote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily: Typography.fontFamily },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assignedPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  assignedPillText: { fontSize: 12, fontWeight: '700', fontFamily: Typography.fontFamily, color: '#10b981', maxWidth: 140 },
  notesIconBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shareBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 6 },
  shareText: { fontSize: 11, fontWeight: '600', fontFamily: Typography.fontFamily },
  handoffBox: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 6 },
  handoffText: { fontSize: 11, lineHeight: 15, fontFamily: Typography.fontFamily, flex: 1 },
});

export default AssignedLeadStrip;
