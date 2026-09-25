import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import * as Haptics from '../lib/haptics';
import { leadsRepository, BrokerageAgent } from '../lib/repositories';

export interface UseAssignmentManagerParams {
  visible: boolean;
  conversationId: string;
  currentAssignedAgentId?: string | null;
  onAssignmentComplete?: (agentName: string, note?: string) => void;
  onClose: () => void;
}

/**
 * useAssignmentManager — Manages brokerage agent rosters & delegation state.
 * Scoped to organization memberships: agency_agent_memberships, developer_agent_memberships.
 */
export function useAssignmentManager({
  visible,
  conversationId,
  currentAssignedAgentId,
  onAssignmentComplete,
  onClose,
}: UseAssignmentManagerParams) {
  const [agents, setAgents] = useState<BrokerageAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(currentAssignedAgentId || null);
  const [handoffNote, setHandoffNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const internalAgents = useMemo(() => agents.filter((a) => a.agentType !== 'external'), [agents]);
  const externalAgents = useMemo(() => agents.filter((a) => a.agentType === 'external'), [agents]);

  useEffect(() => {
    setSelectedAgentId(currentAssignedAgentId || null);
    if (currentAssignedAgentId && agents.length > 0) {
      const assigned = agents.find((a) => a.userId === currentAssignedAgentId);
      if (assigned?.agentType === 'external') setActiveTab('external');
      else if (assigned?.agentType === 'internal') setActiveTab('internal');
    }
  }, [currentAssignedAgentId, agents]);

  useEffect(() => {
    if (agents.length > 0) {
      const hasInternal = agents.some((a) => a.agentType !== 'external');
      const hasExternal = agents.some((a) => a.agentType === 'external');
      if (!hasInternal && hasExternal) setActiveTab('external');
    }
  }, [agents]);

  const fetchBrokerageAgents = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) { setLoading(false); return; }
      const agentList = await leadsRepository.fetchBrokerageAgents(currentUser.id, conversationId);
      setAgents(agentList);
    } catch (err: any) {
      console.warn('[useAssignmentManager] Error loading agents:', err);
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

  const currentTabAgents = activeTab === 'internal' ? internalAgents : externalAgents;

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return currentTabAgents;
    const q = searchQuery.toLowerCase();
    return currentTabAgents.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
  }, [currentTabAgents, searchQuery]);

  const selectedAgent = useMemo(() => agents.find((a) => a.userId === selectedAgentId), [agents, selectedAgentId]);

  const handleAssign = useCallback(async () => {
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
        conversationId, currentUserId: currentUser.id, currentAssignedAgentId, selectedAgent, handoffNote,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAssignmentComplete?.(selectedAgent.name, handoffNote.trim());
      onClose();
    } catch (err: any) {
      console.warn('[useAssignmentManager] Error updating assignment:', err);
      setErrorMessage(err?.message || 'Unable to update assignment.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAgent, conversationId, currentAssignedAgentId, handoffNote, onAssignmentComplete, onClose]);

  const handleUnassign = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) throw new Error('User not authenticated');
      await leadsRepository.unassignAgentFromLead({ conversationId, currentUserId: currentUser.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAssignmentComplete?.('Unassigned');
      onClose();
    } catch (err: any) {
      console.warn('[useAssignmentManager] Error unassigning lead:', err);
      setErrorMessage(err?.message || 'Unable to unassign lead.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [conversationId, onAssignmentComplete, onClose]);

  return {
    agents, loading, activeTab, setActiveTab, searchQuery, setSearchQuery,
    selectedAgentId, setSelectedAgentId, selectedAgent, handoffNote, setHandoffNote,
    isSubmitting, errorMessage, setErrorMessage, internalAgents, externalAgents,
    filteredAgents, handleAssign, handleUnassign,
  };
}
