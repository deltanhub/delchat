import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Haptics from '../../lib/haptics';
import { isAgencyOrDeveloper, isAgent, AppProfile } from '../../lib/auth';
import { ChatLeadItem, ManualLeadItem } from './types';
import {
  resolveListingMetadata, resolveBuyerNames, resolveAgentProfiles,
  fetchManualCrmLeads, computeManualCounts, fetchRawChatLeadsAndInquiries,
  useManualLeadActions, appendStandaloneInquiries,
} from './data';

export function useLeadsData(currentUser: any, currentProfile: AppProfile | null) {
  const [chatLeads, setChatLeads] = useState<ChatLeadItem[]>([]);
  const [manualLeads, setManualLeads] = useState<ManualLeadItem[]>([]);
  const [savingChatLeadId, setSavingChatLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllLeads = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const isAgencyDev = isAgencyOrDeveloper(currentProfile?.mainRole);
      const isAgentUser = isAgent(currentProfile?.mainRole);
      const { rawChatLeads, rawInquiries, agentAssignedListingIds } = await fetchRawChatLeadsAndInquiries(
        supabase, currentUser.id, isAgencyDev, isAgentUser
      );
      const listingIds = Array.from(new Set([
        ...(rawChatLeads || []).map((r: any) => r.listing_id),
        ...(rawInquiries || []).map((i: any) => i.listing_id),
        ...agentAssignedListingIds,
      ].filter(Boolean)));

      const { listingTitleMap, listingAgentMap, listingAssignedAgentIds } = await resolveListingMetadata(supabase, listingIds);
      const buyerIds = Array.from(new Set((rawInquiries || []).map((i) => i.buyer_user_id).filter(Boolean)));
      const buyerNameMap = await resolveBuyerNames(supabase, buyerIds);
      const agentIds = Array.from(new Set([
        ...(rawChatLeads || []).map((r: any) => r.assigned_to_user_id),
        ...(rawInquiries || []).map((i: any) => i.assigned_agent_user_id),
        ...listingAssignedAgentIds,
      ].filter(Boolean)));
      const agentMap = await resolveAgentProfiles(supabase, agentIds);

      const inqById = new Map<string, any>();
      const inqByConvId = new Map<string, any>();
      (rawInquiries || []).forEach((inq: any) => {
        if (inq.id) inqById.set(inq.id, inq);
        if (inq.conversation_id) inqByConvId.set(inq.conversation_id, inq);
      });

      const mappedChatLeads: ChatLeadItem[] = (rawChatLeads || []).map((r: any) => {
        const linkedInq = (r.inquiry_id && inqById.get(r.inquiry_id)) || (r.conversation_id && inqByConvId.get(r.conversation_id));
        const targetListingId = r.listing_id || linkedInq?.listing_id || null;
        const listingAssignedAgent = targetListingId ? listingAgentMap.get(targetListingId) : null;
        const assignedUserId = r.assigned_to_user_id || linkedInq?.assigned_agent_user_id || listingAssignedAgent || null;
        const agentProfile = assignedUserId ? agentMap.get(assignedUserId) : null;
        return {
          id: r.id,
          conversationId: r.conversation_id,
          inquiryId: r.inquiry_id || linkedInq?.id || null,
          listingId: targetListingId,
          listingTitle: targetListingId ? listingTitleMap.get(targetListingId) || null : null,
          source: r.source || 'chat',
          fullName: r.full_name || (linkedInq?.buyer_user_id ? buyerNameMap.get(linkedInq.buyer_user_id) : null) || 'Anonymous Client',
          email: r.email,
          phone: r.phone,
          note: r.note || linkedInq?.handoff_note || null,
          status: (r.lead_status as ChatLeadItem['status']) || 'new',
          assignedToUserId: assignedUserId,
          assignedAgentName: agentProfile?.fullName || null,
          assignedAgentAvatarUrl: agentProfile?.avatarUrl || null,
          createdByUserId: r.created_by_user_id || linkedInq?.company_user_id || linkedInq?.agency_user_id || null,
          createdAt: r.created_at,
          masterLeadStatus: linkedInq?.master_lead_status || r.lead_status || 'new',
        };
      });

      appendStandaloneInquiries(rawInquiries, mappedChatLeads, listingAgentMap, agentMap, buyerNameMap, listingTitleMap);
      setChatLeads(mappedChatLeads);
      const mappedManualLeads = await fetchManualCrmLeads(supabase, currentUser.id);
      setManualLeads(mappedManualLeads);
    } catch (err) {
      console.warn('Error fetching leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, currentProfile?.mainRole]);

  useEffect(() => {
    if (currentUser) fetchAllLeads();
  }, [currentUser, fetchAllLeads]);

  useEffect(() => {
    if (!currentUser) return;
    const channelName = `delchat-leads-${currentUser.id}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) void supabase.removeChannel(existing);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, () => fetchAllLeads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_crm_entries' }, () => fetchAllLeads())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [currentUser, fetchAllLeads]);

  const updateChatLeadStatus = useCallback(async (leadId: string, nextStatus: ChatLeadItem['status']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavingChatLeadId(leadId);
    setChatLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: nextStatus, masterLeadStatus: nextStatus } : l));
    try {
      await supabase.from('crm_leads').update({ lead_status: nextStatus, updated_at: new Date().toISOString() }).eq('id', leadId);
      await supabase.from('crm_inquiries').update({
        inquiry_status: nextStatus === 'converted' ? 'closed' : nextStatus === 'closed_lost' ? 'lost' : nextStatus,
        master_lead_status: nextStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
      fetchAllLeads();
    } finally {
      setSavingChatLeadId(null);
    }
  }, [fetchAllLeads]);

  const manualCounts = useMemo(() => computeManualCounts(manualLeads), [manualLeads]);

  const {
    isSavingNotes, isSubmittingForm, createManualLead,
    saveManualLeadNotes, updateManualLeadStatus,
  } = useManualLeadActions(currentUser, setManualLeads, fetchAllLeads);

  return {
    chatLeads, manualLeads, manualCounts, loading, refreshing,
    savingChatLeadId, isSubmittingForm, isSavingNotes, fetchAllLeads,
    updateChatLeadStatus, createManualLead, saveManualLeadNotes, updateManualLeadStatus,
  };
}
