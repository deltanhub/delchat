import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { ChatLeadItem, CHAT_LEAD_STATUS_OPTIONS } from '../types';
import { styles } from './styles';
import { ChatLeadsCardProps } from './types';

export function ChatLeadsCard({
  item,
  currentUser,
  isDark,
  colors,
  savingChatLeadId,
  onUpdateChatLeadStatus,
  onOpenConversation,
}: ChatLeadsCardProps) {
  const statusMeta =
    CHAT_LEAD_STATUS_OPTIONS.find((s) => s.value === item.status) || CHAT_LEAD_STATUS_OPTIONS[1];

  const isMasterLead = Boolean(item.assignedToUserId) && item.assignedToUserId !== currentUser?.id;
  const isUnassigned = !item.assignedToUserId;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.fullName}</Text>
            <View style={[styles.statusPill, { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight }]}>
              <Text style={[styles.statusPillText, { color: statusMeta.color }]}>
                {statusMeta.label.toUpperCase()}
              </Text>
            </View>
            {isMasterLead ? (
              <View style={[styles.masterLeadBadge, { backgroundColor: isDark ? '#2c0810' : '#fdf2f4', borderColor: isDark ? '#4a0f1f' : '#efe3e8' }]}>
                <Ionicons name="briefcase" size={10} color={isDark ? '#f4e7eb' : '#4a0f1f'} style={{ marginRight: 3 }} />
                <Text style={[styles.masterLeadBadgeText, { color: isDark ? '#f4e7eb' : '#4a0f1f' }]}>
                  MASTER LEAD
                </Text>
              </View>
            ) : isUnassigned ? (
              <View style={[styles.unassignedBadge, { backgroundColor: isDark ? '#2d1f05' : '#fffbeb', borderColor: isDark ? '#78350f' : '#fde68a' }]}>
                <Ionicons name="alert-circle" size={10} color="#d97706" style={{ marginRight: 3 }} />
                <Text style={[styles.unassignedBadgeText, { color: '#d97706' }]}>UNASSIGNED</Text>
              </View>
            ) : (
              <View style={[styles.selfAssignedBadge, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#047857' : '#a7f3d0' }]}>
                <Ionicons name="shield-checkmark" size={10} color="#059669" style={{ marginRight: 3 }} />
                <Text style={[styles.selfAssignedBadgeText, { color: '#059669' }]}>ASSIGNED TO YOU</Text>
              </View>
            )}
            <View style={[styles.sourcePill, { backgroundColor: isDark ? '#3d1624' : '#fcedf2' }]}>
              <Text style={[styles.sourcePillText, { color: colors.primary }]}>FROM CHAT</Text>
            </View>
          </View>

          {item.assignedAgentName && item.assignedAgentName !== 'Unassigned' && (
            <View style={[styles.assignedAgentChip, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}>
              <View style={[styles.agentInitialsCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.agentInitialsText}>
                  {item.assignedAgentName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.assignedAgentName, { color: colors.text }]} numberOfLines={1}>
                Agent: {item.assignedAgentName}
              </Text>
            </View>
          )}

          {item.listingTitle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="business-outline" size={12} color={colors.placeholder} style={{ marginRight: 4 }} />
              <Text style={[styles.listingTitleText, { color: isDark ? '#9ca3af' : '#435977' }]} numberOfLines={1}>
                {item.listingTitle}
              </Text>
            </View>
          )}

          {(item.email || item.phone) && (
            <Text style={[styles.cardMeta, { color: colors.placeholder }]}>
              {[item.email, item.phone].filter(Boolean).join(' · ')}
            </Text>
          )}

          {item.note && (
            <Text style={[styles.cardNote, { color: colors.text }]} numberOfLines={2}>
              {item.note}
            </Text>
          )}
        </View>

        {item.conversationId && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenConversation(item.conversationId!, item.fullName || 'Lead');
            }}
            style={[
              styles.openChatBtn,
              { borderColor: colors.border, backgroundColor: isDark ? '#262626' : '#fdf6f8' },
            ]}
          >
            <Ionicons name="chatbubble" size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.openChatBtnText, { color: colors.primary }]}>Open conversation</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.setStatusRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.setStatusLabel, { color: colors.placeholder }]}>SET STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {CHAT_LEAD_STATUS_OPTIONS.filter((s) => s.value !== 'all').map((st) => {
            const isCurrent = item.status === st.value;
            return (
              <TouchableOpacity
                key={st.value}
                disabled={isCurrent || savingChatLeadId === item.id}
                onPress={() => onUpdateChatLeadStatus(item.id, st.value as ChatLeadItem['status'])}
                style={[
                  styles.setStageBtn,
                  isCurrent
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: isDark ? '#1e1e1e' : '#ffffff', borderColor: colors.border },
                ]}
              >
                <Text style={[styles.setStageBtnText, { color: isCurrent ? '#ffffff' : colors.text }]}>
                  {isCurrent && savingChatLeadId === item.id ? 'Saving...' : st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={[styles.timestampText, { color: colors.placeholder }]}>
        Captured {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
}
