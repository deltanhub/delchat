import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Haptics from '../../lib/haptics';
import { isAgencyOrDeveloper, isAgent, AppProfile } from '../../lib/auth';
import { ChatLeadItem, ManualLeadItem } from './types';

export function useLeadsData(currentUser: any, currentProfile: AppProfile | null) {
  const [chatLeads, setChatLeads] = useState<ChatLeadItem[]>([]);
  const [manualLeads, setManualLeads] = useState<ManualLeadItem[]>([]);
  const [savingChatLeadId, setSavingChatLeadId] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all leads data (chat leads + manual CRM leads)
  const fetchAllLeads = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const isAgencyDev = isAgencyOrDeveloper(currentProfile?.mainRole);
      const isAgentUser = isAgent(currentProfile?.mainRole);

      // A. Fetch Chat Leads (crm_leads + crm_inquiries)
      let chatQuery = supabase
        .from('crm_leads')
        .select(`
          id, conversation_id, inquiry_id, listing_id, source,
          full_name, email, phone, note, lead_status,
          assigned_to_user_id, created_by_user_id, created_at
        `);

      if (isAgencyDev) {
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

        const orgMemberIds = [
          currentUser.id,
          ...(agencyMembers?.map((m) => m.agent_user_id) || []),
          ...(devMembers?.map((m) => m.agent_user_id) || []),
        ];
        chatQuery = chatQuery.or(
          `assigned_to_user_id.in.(${orgMemberIds.join(',')}),created_by_user_id.in.(${orgMemberIds.join(',')})`
        );
      } else if (isAgentUser) {
        chatQuery = chatQuery.or(
          `assigned_to_user_id.eq.${currentUser.id},created_by_user_id.eq.${currentUser.id}`
        );
      } else {
        chatQuery = chatQuery.or(
          `created_by_user_id.eq.${currentUser.id},assigned_to_user_id.eq.${currentUser.id}`
        );
      }

      const { data: rawChatLeads, error: chatErr } = await chatQuery.order('created_at', { ascending: false });
      if (chatErr) throw chatErr;

      // Inquiries where user is recipient / company / agency / agent
      let inqQuery = supabase
        .from('crm_inquiries')
        .select(`
          id, conversation_id, listing_id, buyer_user_id, recipient_user_id,
          agency_user_id, company_user_id, assigned_agent_user_id, first_intent,
          inquiry_status, master_lead_status, created_at, handoff_note
        `);

      if (isAgencyDev) {
        inqQuery = inqQuery.or(
          `company_user_id.eq.${currentUser.id},agency_user_id.eq.${currentUser.id},recipient_user_id.eq.${currentUser.id}`
        );
      } else if (isAgentUser) {
        inqQuery = inqQuery.eq('assigned_agent_user_id', currentUser.id);
      } else {
        inqQuery = inqQuery.or(
          `buyer_user_id.eq.${currentUser.id},recipient_user_id.eq.${currentUser.id}`
        );
      }

      const { data: rawInquiries } = await inqQuery.order('created_at', { ascending: false });

      // Resolve public profiles for inquiry buyer names
      const buyerIds = Array.from(new Set((rawInquiries || []).map((i) => i.buyer_user_id).filter(Boolean)));
      const buyerNameMap = new Map<string, string>();
      if (buyerIds.length > 0) {
        const { data: buyerProfiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: buyerIds,
        });
        (buyerProfiles || []).forEach((bp: any) => {
          buyerNameMap.set(bp.user_id, bp.display_name?.trim() || bp.full_name?.trim() || 'Client');
        });
      }

      // Map chat leads
      const mappedChatLeads: ChatLeadItem[] = (rawChatLeads || []).map((r: any) => ({
        id: r.id,
        conversationId: r.conversation_id,
        inquiryId: r.inquiry_id,
        listingId: r.listing_id,
        source: r.source || 'chat',
        fullName: r.full_name || 'Anonymous Client',
        email: r.email,
        phone: r.phone,
        note: r.note,
        status: (r.lead_status as ChatLeadItem['status']) || 'new',
        assignedToUserId: r.assigned_to_user_id,
        createdByUserId: r.created_by_user_id,
        createdAt: r.created_at,
      }));

      // Add direct inquiry leads if not already mapped
      const existingConvIds = new Set(mappedChatLeads.map((m) => m.conversationId).filter(Boolean));
      (rawInquiries || []).forEach((inq: any) => {
        if (!existingConvIds.has(inq.conversation_id)) {
          const normStatus =
            inq.inquiry_status === 'closed'
              ? 'converted'
              : inq.inquiry_status === 'lost'
              ? 'closed_lost'
              : inq.inquiry_status;
          mappedChatLeads.push({
            id: inq.id,
            conversationId: inq.conversation_id,
            inquiryId: inq.id,
            listingId: inq.listing_id,
            source: 'Property inquiry',
            fullName: buyerNameMap.get(inq.buyer_user_id) || 'Prospective Buyer',
            email: null,
            phone: null,
            note: inq.first_intent || inq.handoff_note || null,
            status: (normStatus as ChatLeadItem['status']) || 'new',
            assignedToUserId: inq.assigned_agent_user_id,
            createdByUserId: inq.company_user_id || inq.agency_user_id || inq.buyer_user_id,
            createdAt: inq.created_at,
            masterLeadStatus: inq.master_lead_status,
          });
        }
      });

      setChatLeads(mappedChatLeads);

      // B. Fetch Manual CRM Leads (dashboard_crm_entries where entry_type = 'lead')
      const { data: rawManualEntries, error: manualErr } = await supabase
        .from('dashboard_crm_entries')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('entry_type', 'lead')
        .order('created_at', { ascending: false });

      if (manualErr) throw manualErr;

      const mappedManualLeads: ManualLeadItem[] = (rawManualEntries || []).map((m: any) => ({
        id: m.id,
        contactName: m.contact_name || 'Contact',
        contactEmail: m.contact_email,
        contactPhone: m.contact_phone,
        source: m.source || 'Dashboard lead',
        status: (m.entry_status as ManualLeadItem['status']) || 'new',
        propertyType: m.property_type,
        propertyStatus: m.property_status,
        propertyLabel: m.property_label,
        priceFrom: m.price_from,
        priceTo: m.price_to,
        bedrooms: m.bedrooms,
        bathrooms: m.bathrooms,
        message: m.message,
        notes: m.metadata?.note || m.message || null,
        createdAt: m.created_at,
      }));

      setManualLeads(mappedManualLeads);
    } catch (err) {
      console.warn('Error fetching leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, currentProfile?.mainRole]);

  useEffect(() => {
    if (currentUser) {
      fetchAllLeads();
    }
  }, [currentUser, fetchAllLeads]);

  // Realtime subscription on crm_leads & dashboard_crm_entries
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`delchat-leads-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, () => {
        fetchAllLeads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_crm_entries' }, () => {
        fetchAllLeads();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser, fetchAllLeads]);

  // Update status for Chat Leads
  const updateChatLeadStatus = useCallback(
    async (leadId: string, nextStatus: ChatLeadItem['status']) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSavingChatLeadId(leadId);
      setChatLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
      );

      try {
        await supabase
          .from('crm_leads')
          .update({ lead_status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', leadId);

        await supabase
          .from('crm_inquiries')
          .update({
            inquiry_status:
              nextStatus === 'converted' ? 'closed' : nextStatus === 'closed_lost' ? 'lost' : nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      } catch (err: any) {
        Alert.alert('Update Failed', err.message);
        fetchAllLeads();
      } finally {
        setSavingChatLeadId(null);
      }
    },
    [fetchAllLeads]
  );

  // Metrics for Manual CRM Leads
  const manualCounts = useMemo(() => {
    const counts = {
      total: manualLeads.length,
      new: 0,
      active: 0,
      viewing: 0,
      closedOrLost: 0,
    };
    for (const lead of manualLeads) {
      if (lead.status === 'new') counts.new++;
      if (['new', 'contacted', 'viewing-scheduled', 'negotiating'].includes(lead.status)) counts.active++;
      if (lead.status === 'viewing-scheduled') counts.viewing++;
      if (['closed', 'lost'].includes(lead.status)) counts.closedOrLost++;
    }
    return counts;
  }, [manualLeads]);

  // Create Manual Lead Form Submission
  const createManualLead = useCallback(
    async (formData: {
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      source: string;
      status: ManualLeadItem['status'];
      propertyType: string;
      propertyStatus: string;
      priceFrom: string;
      priceTo: string;
      bedrooms: string;
      bathrooms: string;
      message: string;
    }): Promise<boolean> => {
      if (!currentUser) return false;
      setIsSubmittingForm(true);
      try {
        const pFrom = formData.priceFrom.trim() ? Number(formData.priceFrom) : null;
        const pTo = formData.priceTo.trim() ? Number(formData.priceTo) : null;
        const beds = formData.bedrooms.trim() ? Number(formData.bedrooms) : null;
        const baths = formData.bathrooms.trim() ? Number(formData.bathrooms) : null;

        const { data, error } = await supabase
          .from('dashboard_crm_entries')
          .insert({
            user_id: currentUser.id,
            entry_type: 'lead',
            contact_name: formData.contactName.trim(),
            contact_email: formData.contactEmail.trim() || null,
            contact_phone: formData.contactPhone.trim() || null,
            source: formData.source,
            entry_status: formData.status,
            property_type: formData.propertyType,
            property_status: formData.propertyStatus,
            price_from: pFrom,
            price_to: pTo,
            bedrooms: beds,
            bathrooms: baths,
            message: formData.message.trim() || null,
            metadata: formData.message.trim() ? { note: formData.message.trim() } : {},
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const createdItem: ManualLeadItem = {
            id: data.id,
            contactName: data.contact_name,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            source: data.source,
            status: data.entry_status,
            propertyType: data.property_type,
            propertyStatus: data.property_status,
            propertyLabel: data.property_label,
            priceFrom: data.price_from,
            priceTo: data.price_to,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            message: data.message,
            notes: data.metadata?.note || data.message || null,
            createdAt: data.created_at,
          };
          setManualLeads((prev) => [createdItem, ...prev]);
        }

        Alert.alert('Lead Created', 'New CRM lead has been added successfully.');
        return true;
      } catch (err: any) {
        Alert.alert('Creation Failed', err.message);
        return false;
      } finally {
        setIsSubmittingForm(false);
      }
    },
    [currentUser]
  );

  // Save Internal Notes on Manual Lead
  const saveManualLeadNotes = useCallback(
    async (leadId: string, notesText: string) => {
      setIsSavingNotes(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        await supabase
          .from('dashboard_crm_entries')
          .update({
            metadata: { note: notesText },
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);

        setManualLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, notes: notesText } : l))
        );
        Alert.alert('Notes Saved', 'Internal notes updated successfully.');
      } catch (err: any) {
        Alert.alert('Failed to save notes', err.message);
      } finally {
        setIsSavingNotes(false);
      }
    },
    []
  );

  // Update Stage for Manual Lead
  const updateManualLeadStatus = useCallback(
    async (leadId: string, nextStatus: ManualLeadItem['status']) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        setManualLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
        );

        await supabase
          .from('dashboard_crm_entries')
          .update({
            entry_status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      } catch (err: any) {
        Alert.alert('Failed to update status', err.message);
        fetchAllLeads();
      }
    },
    [fetchAllLeads]
  );

  return {
    chatLeads,
    manualLeads,
    manualCounts,
    loading,
    refreshing,
    savingChatLeadId,
    isSubmittingForm,
    isSavingNotes,
    fetchAllLeads,
    updateChatLeadStatus,
    createManualLead,
    saveManualLeadNotes,
    updateManualLeadStatus,
  };
}
