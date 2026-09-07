import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';
import { ChatLeadItem, CHAT_LEAD_STATUS_OPTIONS } from './types';

interface ChatLeadsViewProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  chatLeads: ChatLeadItem[];
  currentUser: { id: string } | null;
  isAgencyOrDev: boolean;
  savingChatLeadId: string | null;
  onUpdateChatLeadStatus: (leadId: string, nextStatus: ChatLeadItem['status']) => void;
  onOpenConversation: (conversationId: string, partnerName: string) => void;
}

export default function ChatLeadsView({
  loading,
  refreshing,
  onRefresh,
  chatLeads,
  currentUser,
  isAgencyOrDev,
  savingChatLeadId,
  onUpdateChatLeadStatus,
  onOpenConversation,
}: ChatLeadsViewProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [chatSubTab, setChatSubTab] = useState<'master' | 'my'>('master');
  const [chatFilterStatus, setChatFilterStatus] = useState<string>('all');

  const masterLeadsCount = useMemo(() => {
    return chatLeads.filter(
      (l) => Boolean(l.assignedToUserId) && l.assignedToUserId !== currentUser?.id
    ).length;
  }, [chatLeads, currentUser?.id]);

  const myLeadsCount = useMemo(() => {
    return chatLeads.filter(
      (l) => !l.assignedToUserId || l.assignedToUserId === currentUser?.id
    ).length;
  }, [chatLeads, currentUser?.id]);

  const partitionedChatLeads = useMemo(() => {
    if (!isAgencyOrDev) return chatLeads;
    if (chatSubTab === 'master') {
      // Master Leads = Company leads delegated to an assigned agent
      return chatLeads.filter(
        (l) => Boolean(l.assignedToUserId) && l.assignedToUserId !== currentUser?.id
      );
    } else {
      // My Leads = Leads handled directly by the agency user or unassigned leads
      return chatLeads.filter(
        (l) => !l.assignedToUserId || l.assignedToUserId === currentUser?.id
      );
    }
  }, [chatLeads, chatSubTab, isAgencyOrDev, currentUser?.id]);

  const filteredChatLeads = useMemo(() => {
    if (chatFilterStatus === 'all') return partitionedChatLeads;
    return partitionedChatLeads.filter((l) => l.status === chatFilterStatus);
  }, [partitionedChatLeads, chatFilterStatus]);

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs for Agency / Developer */}
      {isAgencyOrDev && (
        <View style={[styles.subTabsRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChatSubTab('master');
            }}
            style={[
              styles.subTabBtn,
              chatSubTab === 'master' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                {
                  color: chatSubTab === 'master' ? colors.primary : colors.placeholder,
                  fontWeight: chatSubTab === 'master' ? '700' : '500',
                },
              ]}
            >
              Master Leads ({masterLeadsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChatSubTab('my');
            }}
            style={[
              styles.subTabBtn,
              chatSubTab === 'my' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                {
                  color: chatSubTab === 'my' ? colors.primary : colors.placeholder,
                  fontWeight: chatSubTab === 'my' ? '700' : '500',
                },
              ]}
            >
              My Leads ({myLeadsCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Pipeline Pills */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CHAT_LEAD_STATUS_OPTIONS.map((st) => {
            const isActive = chatFilterStatus === st.value;
            const count =
              st.value === 'all'
                ? partitionedChatLeads.length
                : partitionedChatLeads.filter((l) => l.status === st.value).length;
            return (
              <TouchableOpacity
                key={st.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChatFilterStatus(st.value);
                }}
                style={[styles.filterChip, isActive && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? '#ffffff' : colors.text }]}>
                  {st.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chat Leads List */}
      {loading && chatLeads.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredChatLeads.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbox-ellipses-outline" size={54} color={colors.placeholder} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Chat Leads Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
            When you press &quot;Add as lead&quot; inside a conversation thread, leads appear here for immediate follow-up.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChatLeads}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 88 }}
          renderItem={({ item }) => {
            const statusMeta =
              CHAT_LEAD_STATUS_OPTIONS.find((s) => s.value === item.status) || CHAT_LEAD_STATUS_OPTIONS[1];
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.fullName}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight },
                        ]}
                      >
                        <Text style={[styles.statusPillText, { color: statusMeta.color }]}>
                          {statusMeta.label.toUpperCase()}
                        </Text>
                      </View>
                      {item.assignedToUserId && item.assignedToUserId !== currentUser?.id ? (
                        <View style={[styles.masterLeadBadge, { backgroundColor: isDark ? '#2c0810' : '#fdf2f4', borderColor: isDark ? '#4a0f1f' : '#efe3e8' }]}>
                          <Ionicons name="briefcase" size={10} color={isDark ? '#f4e7eb' : '#4a0f1f'} style={{ marginRight: 3 }} />
                          <Text style={[styles.masterLeadBadgeText, { color: isDark ? '#f4e7eb' : '#4a0f1f' }]}>
                            MASTER LEAD
                          </Text>
                        </View>
                      ) : !item.assignedToUserId ? (
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

                {/* Set Status Pipeline Buttons */}
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
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  subTabBtn: {
    paddingVertical: 10,
    marginRight: 20,
  },
  subTabText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  filterChipText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  sourcePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  cardMeta: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  cardNote: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
    fontFamily: Typography.fontFamily,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  openChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  setStatusRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  setStageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  setStageBtnText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 8,
    fontFamily: Typography.fontFamily,
  },
  masterLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  masterLeadBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Typography.fontFamily,
  },
  unassignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  unassignedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  selfAssignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  selfAssignedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  assignedAgentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  agentInitialsCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  agentInitialsText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '700',
  },
  assignedAgentName: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  listingTitleText: {
    fontSize: 11.5,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});
