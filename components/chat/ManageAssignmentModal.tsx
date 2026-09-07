import React, { useState, useEffect, useCallback } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    currentAssignedAgentId || null
  );
  const [handoffNote, setHandoffNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected agent if prop changes
  useEffect(() => {
    setSelectedAgentId(currentAssignedAgentId || null);
  }, [currentAssignedAgentId]);

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

  const filteredAgents = agents.filter((a) => {
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
              paddingBottom: Math.max(insets.bottom, 16),
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
                <Ionicons name="person-outline" size={40} color={colors.placeholder} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No agents found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                  No brokerage team members matched your search.
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: isDark ? '#140509' : '#fbfcfd' }]}>
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

              <ScalePressable
                onPress={handleAssign}
                disabled={isSubmitting || !selectedAgentId}
                style={[
                  styles.assignBtn,
                  {
                    backgroundColor: selectedAgentId ? colors.primary : colors.border,
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
                    <Text style={styles.assignBtnText}>
                      {currentAssignedAgentId ? 'Reassign Lead' : 'Assign to Agent'}
                    </Text>
                  </>
                )}
              </ScalePressable>
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
  listWrapper: {
    maxHeight: SCREEN_HEIGHT * 0.40,
    flexShrink: 1,
  },
  agentList: {
    flexGrow: 0,
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
    paddingBottom: 10,
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
