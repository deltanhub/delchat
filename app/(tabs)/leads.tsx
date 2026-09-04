import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import ScalePressable from '../../components/ScalePressable';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import * as Haptics from '../../lib/haptics';
import { resolveAvatarUrl } from '../../lib/media-utils';
import LeadInternalNotesModal from '../../components/chat/LeadInternalNotesModal';

export interface LeadItem {
  id: string;
  conversationId: string | null;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  budget?: string | null;
  status: 'new' | 'assigned' | 'contacted' | 'qualified' | 'negotiating' | 'closed' | 'lost';
  assignedAgent?: {
    userId: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  } | null;
  createdAt: string;
  listingTitle?: string | null;
}

export interface TeamAgent {
  userId: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  email?: string;
  phone?: string;
}

export interface AssignmentHistoryItem {
  id: string;
  action_kind: string;
  handoff_note: string | null;
  created_at: string;
  assigned_agent_user_id: string;
  assigned_by_user_id: string;
  agentName?: string;
  assignedByName?: string;
}

const STATUS_PIPELINE: Array<{
  value: LeadItem['status'];
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
}> = [
  { value: 'new', label: 'New', color: '#2563eb', bgLight: '#eff6ff', bgDark: '#1e293b' },
  { value: 'assigned', label: 'Assigned', color: '#7c3aed', bgLight: '#f5f3ff', bgDark: '#2e1065' },
  { value: 'contacted', label: 'Contacted', color: '#0891b2', bgLight: '#ecfeff', bgDark: '#164e63' },
  { value: 'qualified', label: 'Qualified', color: '#059669', bgLight: '#ecfdf5', bgDark: '#064e3b' },
  { value: 'negotiating', label: 'Negotiating', color: '#d97706', bgLight: '#fffbeb', bgDark: '#78350f' },
  { value: 'closed', label: 'Closed / Won', color: '#16a34a', bgLight: '#f0fdf4', bgDark: '#14532d' },
  { value: 'lost', label: 'Lost', color: '#dc2626', bgLight: '#fef2f2', bgDark: '#7f1d1d' },
];

export default function LeadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [teamAgents, setTeamAgents] = useState<TeamAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Lead Action Modals
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [historyItems, setHistoryItems] = useState<AssignmentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
    });
  }, []);

  // Fetch live team agents
  const fetchTeamAgents = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data: agencyMembers } = await supabase
        .from('agency_agent_memberships')
        .select('agent_user_id')
        .eq('agency_user_id', currentUser.id)
        .eq('membership_status', 'active');

      const { data: devMembers } = await supabase
        .from('developer_agent_memberships')
        .select('agent_user_id')
        .eq('developer_user_id', currentUser.id)
        .eq('membership_status', 'active');

      const agentIds = Array.from(
        new Set([
          ...(agencyMembers?.map((m) => m.agent_user_id) || []),
          ...(devMembers?.map((m) => m.agent_user_id) || []),
        ])
      );

      if (agentIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: agentIds,
        });

        const mapped: TeamAgent[] = (profiles || []).map((p: any) => ({
          userId: p.user_id,
          name: p.display_name?.trim() || p.full_name?.trim() || 'Agent',
          role: p.role || 'Listing Agent',
          avatarUrl: resolveAvatarUrl(p.avatar_url),
          email: p.email,
          phone: p.phone,
        }));
        setTeamAgents(mapped);
      }
    } catch (e) {
      console.warn('Error fetching team agents:', e);
    }
  }, [currentUser]);

  // Fetch live CRM inquiries
  const fetchLeads = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data: rawLeads, error } = await supabase
        .from('crm_inquiries')
        .select(`
          id, conversation_id, buyer_user_id, assigned_agent_user_id,
          lead_name, lead_email, lead_phone, budget_raw,
          master_lead_status, created_at,
          listing:listings (id, title)
        `)
        .or(`agency_user_id.eq.${currentUser.id},assigned_agent_user_id.eq.${currentUser.id},company_user_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Resolve agent profiles for assigned leads
      const assignedAgentIds = Array.from(
        new Set((rawLeads || []).map((l) => l.assigned_agent_user_id).filter(Boolean))
      );
      const agentMap = new Map<string, any>();
      if (assignedAgentIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: assignedAgentIds,
        });
        profiles?.forEach((p: any) => {
          agentMap.set(p.user_id, p);
        });
      }

      const mapped: LeadItem[] = (rawLeads || []).map((l: any) => {
        const agentProf = l.assigned_agent_user_id ? agentMap.get(l.assigned_agent_user_id) : null;
        const listingObj = Array.isArray(l.listing) ? l.listing[0] : l.listing;

        return {
          id: l.id,
          conversationId: l.conversation_id || null,
          contactName: l.lead_name || 'Prospective Buyer',
          contactEmail: l.lead_email,
          contactPhone: l.lead_phone,
          budget: l.budget_raw,
          status: (l.master_lead_status as any) || 'new',
          assignedAgent: agentProf
            ? {
                userId: agentProf.user_id,
                name: agentProf.display_name?.trim() || agentProf.full_name?.trim() || 'Assigned Agent',
                avatarUrl: resolveAvatarUrl(agentProf.avatar_url),
                role: agentProf.role || 'Agent',
              }
            : null,
          createdAt: l.created_at,
          listingTitle: listingObj?.title || null,
        };
      });

      setLeads(mapped);
    } catch (e) {
      console.warn('Error loading leads', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchLeads();
      fetchTeamAgents();
    }
  }, [currentUser, fetchLeads, fetchTeamAgents]);

  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadItem['status']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      setStatusModalVisible(false);

      await supabase
        .from('crm_inquiries')
        .update({
          master_lead_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } catch (e: any) {
      Alert.alert('Status Error', e.message);
    }
  };

  const handleAssignAgentToLead = async (leadId: string, agent: TeamAgent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: 'assigned',
                assignedAgent: {
                  userId: agent.userId,
                  name: agent.name,
                  avatarUrl: agent.avatarUrl,
                  role: agent.role,
                },
              }
            : l
        )
      );
      setAssignModalVisible(false);

      await supabase
        .from('crm_inquiries')
        .update({
          assigned_agent_user_id: agent.userId,
          assigned_by_user_id: currentUser.id,
          assigned_at: new Date().toISOString(),
          master_lead_status: 'assigned',
        })
        .eq('id', leadId);

      await supabase.from('crm_inquiry_assignment_history').insert({
        inquiry_id: leadId,
        agency_user_id: currentUser.id,
        assigned_agent_user_id: agent.userId,
        assigned_by_user_id: currentUser.id,
        action_kind: 'assigned',
        handoff_note: 'Assigned via DelChat Mobile CRM',
      });

      Alert.alert('Lead Assigned', `Lead successfully allocated to ${agent.name}.`);
    } catch (e: any) {
      Alert.alert('Assignment Error', e.message);
    }
  };

  const handleOpenHistory = async (lead: LeadItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLead(lead);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('crm_inquiry_assignment_history')
        .select('id, action_kind, handoff_note, created_at, assigned_agent_user_id, assigned_by_user_id')
        .eq('inquiry_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = Array.from(
          new Set(
            data
              .flatMap((d: any) => [d.assigned_agent_user_id, d.assigned_by_user_id])
              .filter(Boolean)
          )
        );

        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: userIds,
        });

        const profileMap = new Map<string, string>();
        (profiles || []).forEach((p: any) => {
          profileMap.set(p.user_id, p.display_name || p.full_name || 'Agent');
        });

        const mapped: AssignmentHistoryItem[] = data.map((d: any) => ({
          id: d.id,
          action_kind: d.action_kind,
          handoff_note: d.handoff_note,
          created_at: d.created_at,
          assigned_agent_user_id: d.assigned_agent_user_id,
          assigned_by_user_id: d.assigned_by_user_id,
          agentName: profileMap.get(d.assigned_agent_user_id) || 'Assigned Agent',
          assignedByName: profileMap.get(d.assigned_by_user_id) || 'Manager',
        }));
        setHistoryItems(mapped);
      } else {
        setHistoryItems([]);
      }
    } catch (e) {
      console.warn('Failed to load history', e);
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>CRM Leads</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                fetchLeads();
              }}
              style={[styles.refreshBtn, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}
            >
              <Ionicons name="sync" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Pipeline Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              onPress={() => setFilterStatus('all')}
              style={[
                styles.filterChip,
                filterStatus === 'all' && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterStatus === 'all' ? '#ffffff' : colors.placeholder },
                ]}
              >
                All ({leads.length})
              </Text>
            </TouchableOpacity>
            {STATUS_PIPELINE.map((st) => {
              const count = leads.filter((l) => l.status === st.value).length;
              const isActive = filterStatus === st.value;
              return (
                <TouchableOpacity
                  key={st.value}
                  onPress={() => setFilterStatus(st.value)}
                  style={[
                    styles.filterChip,
                    isActive && { backgroundColor: st.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#ffffff' : colors.placeholder },
                    ]}
                  >
                    {st.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Leads Feed */}
        {loading && leads.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredLeads.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="folder-open-outline" size={54} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Leads Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
              {filterStatus === 'all'
                ? 'No client inquiries or leads recorded in your CRM pipeline yet.'
                : `No leads currently in the "${filterStatus}" stage.`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchLeads();
                }}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const statusMeta = STATUS_PIPELINE.find((s) => s.value === item.status) || STATUS_PIPELINE[0];
              return (
                <ScalePressable
                  onPress={() => {
                    if (item.conversationId) {
                      router.push({
                        pathname: '/thread/[id]',
                        params: {
                          id: item.conversationId,
                          partnerName: item.contactName,
                        },
                      });
                    }
                  }}
                  style={[
                    styles.leadCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Top: Name & Pipeline Status */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>
                        {item.contactName}
                      </Text>
                      {item.listingTitle && (
                        <Text style={[styles.listingTitle, { color: colors.placeholder }]} numberOfLines={1}>
                          {item.listingTitle}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedLead(item);
                        setStatusModalVisible(true);
                      }}
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
                      <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                        {statusMeta.label}
                      </Text>
                      <Ionicons name="chevron-down" size={12} color={statusMeta.color} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </View>

                  {/* Contact info & Budget */}
                  <View style={styles.metaRow}>
                    {item.contactPhone && (
                      <View style={styles.metaPill}>
                        <Ionicons name="call-outline" size={13} color={colors.placeholder} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaPillText, { color: colors.text }]}>{item.contactPhone}</Text>
                      </View>
                    )}
                    {item.budget && (
                      <View style={styles.metaPill}>
                        <Ionicons name="cash-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaPillText, { color: colors.primary, fontWeight: '600' }]}>
                          {item.budget}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Footer: Assigned Agent & Action buttons */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.agentSection}>
                      {item.assignedAgent ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {item.assignedAgent.avatarUrl ? (
                            <Image source={{ uri: item.assignedAgent.avatarUrl }} style={styles.agentAvatar} />
                          ) : (
                            <View style={[styles.agentAvatarFallback, { backgroundColor: colors.primarySoft }]}>
                              <Ionicons name="person" size={12} color={colors.primary} />
                            </View>
                          )}
                          <View style={{ marginLeft: 8 }}>
                            <Text style={[styles.agentLabel, { color: colors.placeholder }]}>Assigned to</Text>
                            <Text style={[styles.agentName, { color: colors.text }]}>{item.assignedAgent.name}</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.unassignedText, { color: colors.placeholder }]}>Unassigned</Text>
                      )}
                    </View>

                    <View style={styles.actionBtns}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedLead(item);
                          setNotesModalVisible(true);
                        }}
                        style={[styles.smallBtn, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}
                      >
                        <Ionicons name="document-text-outline" size={15} color={colors.primary} />
                        <Text style={[styles.smallBtnText, { color: colors.primary }]}>Notes</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleOpenHistory(item)}
                        style={[styles.smallBtn, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]}
                      >
                        <Ionicons name="time-outline" size={15} color={colors.text} />
                        <Text style={[styles.smallBtnText, { color: colors.text }]}>History</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedLead(item);
                          setAssignModalVisible(true);
                        }}
                        style={[styles.smallBtn, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}
                      >
                        <Ionicons name="person-add-outline" size={15} color={colors.primary} />
                        <Text style={[styles.smallBtnText, { color: colors.primary }]}>
                          {item.assignedAgent ? 'Reassign' : 'Assign'}
                        </Text>
                      </TouchableOpacity>

                      {item.conversationId && (
                        <TouchableOpacity
                          onPress={() => {
                            router.push({
                              pathname: '/thread/[id]',
                              params: {
                                id: item.conversationId!,
                                partnerName: item.contactName,
                              },
                            });
                          }}
                          style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={15} color="#ffffff" />
                          <Text style={[styles.smallBtnText, { color: '#ffffff' }]}>Chat</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </ScalePressable>
              );
            }}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          />
        )}

        {/* Status Transition Modal */}
        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
            style={styles.modalBackdrop}
          >
            <View style={[styles.statusModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Update Pipeline Status</Text>
              <Text style={[styles.modalSubtitle, { color: colors.placeholder }]}>
                Select current stage for {selectedLead?.contactName}
              </Text>

              {STATUS_PIPELINE.map((s) => {
                const isCurrent = selectedLead?.status === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => {
                      if (selectedLead) handleUpdateLeadStatus(selectedLead.id, s.value);
                    }}
                    style={[
                      styles.statusOption,
                      isCurrent && { backgroundColor: isDark ? '#262626' : colors.primarySoft },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                    <Text
                      style={[
                        styles.statusOptionText,
                        { color: colors.text },
                        isCurrent && { fontWeight: '700', color: colors.primary },
                      ]}
                    >
                      {s.label}
                    </Text>
                    {isCurrent && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Agent Assignment Modal */}
        <Modal
          visible={assignModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setAssignModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.assignModalCard,
                { backgroundColor: colors.card, borderTopColor: colors.border },
              ]}
            >
              <View style={styles.assignHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Assign to Team Agent</Text>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {teamAgents.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.placeholder, textAlign: 'center' }}>
                    No team members found in your agency roster.
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 340 }}>
                  {teamAgents.map((agent) => (
                    <TouchableOpacity
                      key={agent.userId}
                      onPress={() => {
                        if (selectedLead) handleAssignAgentToLead(selectedLead.id, agent);
                      }}
                      style={[styles.agentRow, { borderBottomColor: colors.border }]}
                    >
                      {agent.avatarUrl ? (
                        <Image source={{ uri: agent.avatarUrl }} style={styles.agentRowAvatar} />
                      ) : (
                        <View style={[styles.agentRowAvatarFallback, { backgroundColor: colors.primarySoft }]}>
                          <Ionicons name="person" size={16} color={colors.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.agentRowName, { color: colors.text }]}>{agent.name}</Text>
                        <Text style={[styles.agentRowRole, { color: colors.placeholder }]}>{agent.role}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Assignment History Modal */}
        <Modal
          visible={historyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setHistoryModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.assignModalCard,
                {
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                  maxHeight: '75%',
                },
              ]}
            >
              <View style={styles.assignHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Assignment History</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.placeholder }]}>
                    {selectedLead?.contactName || 'Lead'} Handoff Audit Trail
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {loadingHistory ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : historyItems.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={36} color={colors.placeholder} />
                  <Text style={{ fontSize: 13, color: colors.placeholder, marginTop: 8 }}>
                    No assignment transfers recorded yet.
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: 12 }}>
                  {historyItems.map((item, idx) => (
                    <View
                      key={item.id || idx}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 10,
                        borderBottomWidth: idx < historyItems.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: isDark ? '#3d1624' : '#fcedf2',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                        }}
                      >
                        <Ionicons name="git-commit-outline" size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                            {item.action_kind === 'assigned' ? 'Assigned to ' + item.agentName : item.action_kind}
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.placeholder }}>
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.placeholder, marginTop: 2 }}>
                          By: {item.assignedByName}
                        </Text>
                        {item.handoff_note && (
                          <Text style={{ fontSize: 12, color: colors.text, marginTop: 4, fontStyle: 'italic' }}>
                            "{item.handoff_note}"
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Lead Internal Team Notes Modal */}
        <LeadInternalNotesModal
          visible={notesModalVisible}
          onClose={() => setNotesModalVisible(false)}
          conversationId={selectedLead?.conversationId || ''}
          inquiryId={selectedLead?.id}
          title={`Team Notes: ${selectedLead?.contactName || 'Lead'}`}
        />
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.5,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
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
  leadCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  listingTitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  agentSection: {
    flex: 1,
  },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  agentAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  unassignedText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusModalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    fontFamily: Typography.fontFamily,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 3,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    marginLeft: 8,
  },
  assignModalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
  },
  assignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  agentRowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  agentRowAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentRowName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  agentRowRole: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
});
