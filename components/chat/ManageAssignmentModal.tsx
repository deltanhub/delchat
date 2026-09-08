import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';
import { leadsRepository, BrokerageAgent } from '../../lib/repositories';

export type { BrokerageAgent };

interface ManageAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  currentAssignedAgentId?: string | null;
  onAssignmentComplete?: (agentName: string, note?: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ManageAssignmentModal({
  visible,
  onClose,
  conversationId,
  currentAssignedAgentId,
  onAssignmentComplete,
}: ManageAssignmentModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [agents, setAgents] = useState<BrokerageAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    currentAssignedAgentId || null
  );
  const [handoffNote, setHandoffNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Partition agents into Internal and External rosters
  const internalAgents = useMemo(
    () => agents.filter((a) => a.agentType !== 'external'),
    [agents]
  );
  const externalAgents = useMemo(
    () => agents.filter((a) => a.agentType === 'external'),
    [agents]
  );

  // Sync selected agent if prop changes & auto-select tab matching current assignment
  useEffect(() => {
    setSelectedAgentId(currentAssignedAgentId || null);
    if (currentAssignedAgentId && agents.length > 0) {
      const assigned = agents.find((a) => a.userId === currentAssignedAgentId);
      if (assigned?.agentType === 'external') {
        setActiveTab('external');
      } else if (assigned?.agentType === 'internal') {
        setActiveTab('internal');
      }
    }
  }, [currentAssignedAgentId, agents]);

  // If initial load has 0 internal but has external agents, default tab to external
  useEffect(() => {
    if (agents.length > 0) {
      const hasInternal = agents.some((a) => a.agentType !== 'external');
      const hasExternal = agents.some((a) => a.agentType === 'external');
      if (!hasInternal && hasExternal) {
        setActiveTab('external');
      }
    }
  }, [agents]);

  const fetchBrokerageAgents = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Organization tenancy scoping (agency_agent_memberships, developer_agent_memberships)
      // is encapsulated cleanly within leadsRepository:
      const agentList = await leadsRepository.fetchBrokerageAgents(
        currentUser.id,
        conversationId
      );
      setAgents(agentList);
    } catch (err: any) {
      console.warn('[ManageAssignmentModal] Error loading agents:', err);
      setErrorMessage(err?.message || 'Failed to load brokerage agents');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (visible) {
      fetchBrokerageAgents();
      setSearchQuery('');
      setHandoffNote('');
      setErrorMessage(null);
    }
  }, [visible, fetchBrokerageAgents]);

  if (!visible) return null;

  const currentTabAgents = activeTab === 'internal' ? internalAgents : externalAgents;

  const filteredAgents = currentTabAgents.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = a.name.toLowerCase().includes(q);
    const emailMatch = a.email?.toLowerCase().includes(q);
    const roleMatch = a.role.toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch;
  });

  const selectedAgent = agents.find((a) => a.userId === selectedAgentId);

  const handleAssign = async () => {
    if (!selectedAgent) {
      setErrorMessage('Please select an agent to assign this lead to.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) throw new Error('User not authenticated');

      await leadsRepository.assignAgentToLead({
        conversationId,
        currentUserId: currentUser.id,
        currentAssignedAgentId,
        selectedAgent,
        handoffNote,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAssignmentComplete?.(selectedAgent.name, handoffNote.trim());
      onClose();
    } catch (err: any) {
      console.warn('[ManageAssignmentModal] Error updating assignment:', err);
      setErrorMessage(err?.message || 'Unable to update assignment.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) throw new Error('User not authenticated');

      await leadsRepository.unassignAgentFromLead({
        conversationId,
        currentUserId: currentUser.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAssignmentComplete?.('Unassigned');
      onClose();
    } catch (err: any) {
      console.warn('[ManageAssignmentModal] Error unassigning lead:', err);
      setErrorMessage(err?.message || 'Unable to unassign lead.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          {/* Top Drag Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#383848' : '#cbd5e1' }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.badgeIcon, { backgroundColor: isDark ? '#3d1624' : '#fcedf2' }]}>
                <Ionicons name="people-circle" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.subTitle, { color: colors.primary }]}>GOVERNANCE & ROUTING</Text>
                <Text style={[styles.title, { color: colors.text }]}>Manage Assignment</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}
              accessibilityRole="button"
              accessibilityLabel="Close assignment modal"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: isDark ? '#2d1419' : '#fff5f6',
                  borderColor: isDark ? '#5c1d29' : '#fed7dd',
                },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color="#e11d48" style={{ marginRight: 6 }} />
              <Text style={[styles.errorText, { color: isDark ? '#fda4af' : '#be123c' }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Search Box */}
          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9', borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={17} color={colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Search brokerage agents by name or role..."
                placeholderTextColor={colors.placeholder}
                style={[styles.searchInput, { color: colors.text }]}
                clearButtonMode="while-editing"
                accessibilityLabel="Search agents"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={17} color={colors.placeholder} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Two Clickable Columns: Live Internal Agents & External Agents */}
          <View style={[styles.columnSwitcherContainer, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('internal');
              }}
              style={[
                styles.columnTab,
                {
                  backgroundColor:
                    activeTab === 'internal'
                      ? isDark
                        ? '#3a0b18'
                        : colors.primarySoft
                      : isDark
                      ? '#18181b'
                      : '#f8fafc',
                  borderColor: activeTab === 'internal' ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Internal Agents"
            >
              <View style={styles.columnTabContent}>
                <View style={styles.columnTabHeader}>
                  <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={activeTab === 'internal' ? colors.primary : colors.placeholder}
                  />
                  <Text
                    style={[
                      styles.columnTabTitle,
                      { color: activeTab === 'internal' ? colors.primary : colors.text },
                      activeTab === 'internal' && { fontWeight: '700' },
                    ]}
                  >
                    Internal Agents
                  </Text>
                </View>
                <View
                  style={[
                    styles.columnBadge,
                    {
                      backgroundColor:
                        activeTab === 'internal'
                          ? colors.primary
                          : isDark
                          ? '#27272a'
                          : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.columnBadgeText,
                      { color: activeTab === 'internal' ? '#ffffff' : colors.placeholder },
                    ]}
                  >
                    {internalAgents.length}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.columnSubLabel,
                  { color: activeTab === 'internal' ? colors.primaryMuted : colors.placeholder },
                ]}
                numberOfLines={1}
              >
                In-house Team
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('external');
              }}
              style={[
                styles.columnTab,
                {
                  backgroundColor:
                    activeTab === 'external'
                      ? isDark
                        ? '#3a0b18'
                        : colors.primarySoft
                      : isDark
                      ? '#18181b'
                      : '#f8fafc',
                  borderColor: activeTab === 'external' ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="External Agents"
            >
              <View style={styles.columnTabContent}>
                <View style={styles.columnTabHeader}>
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={activeTab === 'external' ? colors.primary : colors.placeholder}
                  />
                  <Text
                    style={[
                      styles.columnTabTitle,
                      { color: activeTab === 'external' ? colors.primary : colors.text },
                      activeTab === 'external' && { fontWeight: '700' },
                    ]}
                  >
                    External Agents
                  </Text>
                </View>
                <View
                  style={[
                    styles.columnBadge,
                    {
                      backgroundColor:
                        activeTab === 'external'
                          ? colors.primary
                          : isDark
                          ? '#27272a'
                          : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.columnBadgeText,
                      { color: activeTab === 'external' ? '#ffffff' : colors.placeholder },
                    ]}
                  >
                    {externalAgents.length}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.columnSubLabel,
                  { color: activeTab === 'external' ? colors.primaryMuted : colors.placeholder },
                ]}
                numberOfLines={1}
              >
                Co-broker & Network
              </Text>
            </TouchableOpacity>
          </View>

          {/* Agent Selection List */}
          <View style={styles.listWrapper}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.placeholder }]}>
                  Loading brokerage agents...
                </Text>
              </View>
            ) : filteredAgents.length === 0 ? (
              <View style={styles.centerContainer}>
                <Ionicons
                  name={activeTab === 'internal' ? 'people-outline' : 'globe-outline'}
                  size={40}
                  color={colors.placeholder}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery.trim()
                    ? 'No matching agents found'
                    : activeTab === 'internal'
                    ? 'No internal agents found'
                    : 'No external agents found'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                  {searchQuery.trim()
                    ? `No ${activeTab} agents matched "${searchQuery}".`
                    : activeTab === 'internal'
                    ? 'No in-house agents are currently linked to this brokerage organization.'
                    : 'No external partner agents are currently linked to this brokerage organization.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredAgents}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                style={styles.agentList}
                renderItem={({ item }) => {
                  const isSelected = selectedAgentId === item.userId;
                  const isCurrent = currentAssignedAgentId === item.userId;

                  return (
                    <ScalePressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedAgentId(item.userId);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      style={[
                        styles.agentCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#3a0b18'
                              : colors.primarySoft
                            : isDark
                            ? '#18181b'
                            : '#ffffff',
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.agentRow}>
                        {item.avatarUrl ? (
                          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View
                            style={[
                              styles.avatarInitials,
                              { backgroundColor: isDark ? '#262626' : '#e2e8f0' },
                            ]}
                          >
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                              {item.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.agentInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text
                              style={[
                                styles.agentName,
                                { color: colors.text },
                                isSelected && { color: colors.primary, fontWeight: '700' },
                              ]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <View
                              style={[
                                styles.agentTypeBadge,
                                {
                                  backgroundColor:
                                    item.agentType === 'external'
                                      ? isDark
                                        ? 'rgba(59, 130, 246, 0.15)'
                                        : '#eff6ff'
                                      : isDark
                                      ? 'rgba(74, 15, 31, 0.25)'
                                      : '#fcedf2',
                                  borderColor:
                                    item.agentType === 'external'
                                      ? isDark
                                        ? '#1d4ed8'
                                        : '#bfdbfe'
                                      : isDark
                                      ? '#5c1d29'
                                      : '#fecdd3',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.agentTypeBadgeText,
                                  {
                                    color:
                                      item.agentType === 'external'
                                        ? isDark
                                          ? '#93c5fd'
                                          : '#2563eb'
                                        : colors.primary,
                                  },
                                ]}
                              >
                                {item.agentType === 'external' ? 'EXTERNAL' : 'INTERNAL'}
                              </Text>
                            </View>
                            {isCurrent && (
                              <View style={[styles.currentBadge, { backgroundColor: isDark ? '#27272a' : '#e2e8f0' }]}>
                                <Text style={[styles.currentBadgeText, { color: colors.placeholder }]}>
                                  Current
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.agentRole, { color: colors.placeholder }]}>
                            {item.role} {item.email ? `• ${item.email}` : ''}
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
                }}
              />
            )}
          </View>

          {/* Handoff Note & Bottom Actions */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: isDark ? '#140509' : '#fbfcfd',
                paddingBottom: Math.max(insets.bottom, 16) + 6,
              },
            ]}
          >
            <Text style={[styles.noteLabel, { color: colors.placeholder }]}>
              INTERNAL HANDOFF NOTE (OPTIONAL)
            </Text>
            <TextInput
              value={handoffNote}
              onChangeText={setHandoffNote}
              placeholder="E.g. Client verified budget N200M, prefers weekend viewings..."
              placeholderTextColor={colors.placeholder}
              style={[
                styles.noteInput,
                {
                  backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              multiline
              maxLength={300}
            />

            <View style={styles.buttonRow}>
              {currentAssignedAgentId ? (
                <TouchableOpacity
                  onPress={handleUnassign}
                  disabled={isSubmitting}
                  style={[styles.unassignBtn, { borderColor: '#ef4444' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Unassign lead"
                >
                  <Text style={styles.unassignBtnText}>Unassign</Text>
                </TouchableOpacity>
              ) : null}

              {!selectedAgentId ? (
                <View
                  style={[
                    styles.assignBtn,
                    {
                      backgroundColor: isDark ? 'rgba(74, 15, 31, 0.20)' : '#fcedf2',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(140, 65, 84, 0.45)' : '#fed7dd',
                      flex: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={17}
                    color={isDark ? '#f4a6b7' : '#9f1239'}
                  />
                  <Text
                    style={[
                      styles.assignBtnText,
                      {
                        color: isDark ? '#f4a6b7' : '#9f1239',
                        fontWeight: '600',
                      },
                    ]}
                  >
                    Select an Agent to Assign
                  </Text>
                </View>
              ) : (
                <ScalePressable
                  onPress={handleAssign}
                  disabled={isSubmitting}
                  style={[
                    styles.assignBtn,
                    {
                      backgroundColor: colors.primary,
                      flex: 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm assignment"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                      <Text style={[styles.assignBtnText, { color: '#ffffff', fontWeight: '700' }]}>
                        {currentAssignedAgentId
                          ? 'Reassign Lead'
                          : `Assign to ${selectedAgent?.name || 'Agent'}`}
                      </Text>
                    </>
                  )}
                </ScalePressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  container: {
    height: Math.min(SCREEN_HEIGHT * 0.82, 720),
    maxHeight: SCREEN_HEIGHT * 0.90,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dragHandleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  columnSwitcherContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  columnTab: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  columnTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnTabTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  columnBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  columnSubLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  agentTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  agentTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listWrapper: {
    flex: 1,
  },
  agentList: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  agentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  agentRole: {
    fontSize: 12,
    marginTop: 2,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 48,
    maxHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unassignBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unassignBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  assignBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
