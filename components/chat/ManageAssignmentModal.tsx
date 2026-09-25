import React from 'react';
import { View, Text, Modal, FlatList, ActivityIndicator, Platform, Pressable, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { BrokerageAgent, leadsRepository } from '../../lib/repositories';
import { useAssignmentManager } from '../../hooks/useAssignmentManager';
import {
  AssignmentAgentCard,
  AssignmentColumnTabs,
  AssignmentFooter,
  AssignmentSearchBar,
  AssignmentHeader,
  styles,
} from './assignment';

export type { BrokerageAgent };

/**
 * Architectural Note & Tenancy Invariant:
 * Scoped to organization memberships: agency_agent_memberships, developer_agent_memberships.
 * Repository delegations:
 * - leadsRepository.fetchBrokerageAgents
 * - leadsRepository.assignAgentToLead
 * - leadsRepository.unassignAgentFromLead
 */
export interface ManageAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  currentAssignedAgentId?: string | null;
  onAssignmentComplete?: (agentName: string, note?: string) => void;
}

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

  const {
    loading, activeTab, setActiveTab, searchQuery, setSearchQuery,
    selectedAgentId, setSelectedAgentId, selectedAgent, handoffNote, setHandoffNote,
    isSubmitting, errorMessage, internalAgents, externalAgents,
    filteredAgents, handleAssign, handleUnassign,
  } = useAssignmentManager({
    visible, conversationId, currentAssignedAgentId, onAssignmentComplete, onClose,
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#1C1C1E' : colors.card,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <AssignmentHeader onClose={onClose} colors={colors} isDark={isDark} />

          <AssignmentSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            errorMessage={errorMessage}
            colors={colors}
            isDark={isDark}
          />

          <AssignmentColumnTabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            internalCount={internalAgents.length}
            externalCount={externalAgents.length}
            colors={colors}
            isDark={isDark}
          />

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredAgents}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <AssignmentAgentCard
                  agent={item}
                  isSelected={selectedAgentId === item.userId}
                  isCurrent={currentAssignedAgentId === item.userId}
                  colors={colors}
                  isDark={isDark}
                  onSelect={(id) => setSelectedAgentId(id)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={32} color={colors.placeholder} />
                  <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                    {searchQuery ? 'No agents match your search' : 'No available agents in this roster'}
                  </Text>
                </View>
              }
            />
          )}

          <AssignmentFooter
            handoffNote={handoffNote}
            setHandoffNote={setHandoffNote}
            currentAssignedAgentId={currentAssignedAgentId}
            selectedAgentId={selectedAgentId}
            selectedAgentName={selectedAgent?.name}
            isSubmitting={isSubmitting}
            colors={colors}
            isDark={isDark}
            bottomInset={insets.bottom}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
