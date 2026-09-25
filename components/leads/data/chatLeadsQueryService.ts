import { SupabaseClient } from '@supabase/supabase-js';
import { fetchAgentAssignedListingIds, fetchOrgMemberIds } from './leadsQueryHelpers';

export interface RawChatLeadsResult {
  rawChatLeads: any[];
  rawInquiries: any[];
  agentAssignedListingIds: string[];
}

export async function fetchRawChatLeadsAndInquiries(
  supabase: SupabaseClient,
  userId: string,
  isAgencyDev: boolean,
  isAgentUser: boolean
): Promise<RawChatLeadsResult> {
  let agentAssignedListingIds: string[] = [];
  if (isAgentUser) {
    agentAssignedListingIds = await fetchAgentAssignedListingIds(supabase, userId);
  }

  let chatQuery = supabase.from('crm_leads').select(`
    id, conversation_id, inquiry_id, listing_id, source,
    full_name, email, phone, note, lead_status,
    assigned_to_user_id, created_by_user_id, created_at
  `);

  if (isAgencyDev) {
    const orgMemberIds = await fetchOrgMemberIds(supabase, userId);
    chatQuery = chatQuery.or(
      `assigned_to_user_id.in.(${orgMemberIds.join(',')}),created_by_user_id.in.(${orgMemberIds.join(',')})`
    );
  } else if (isAgentUser) {
    chatQuery = agentAssignedListingIds.length > 0
      ? chatQuery.or(`assigned_to_user_id.eq.${userId},created_by_user_id.eq.${userId},listing_id.in.(${agentAssignedListingIds.join(',')})`)
      : chatQuery.or(`assigned_to_user_id.eq.${userId},created_by_user_id.eq.${userId}`);
  } else {
    chatQuery = chatQuery.or(`created_by_user_id.eq.${userId},assigned_to_user_id.eq.${userId}`);
  }

  const { data: rawChatLeads, error: chatErr } = await chatQuery.order('created_at', { ascending: false });
  if (chatErr) throw chatErr;

  let inqQuery = supabase.from('crm_inquiries').select(`
    id, conversation_id, listing_id, buyer_user_id, recipient_user_id,
    agency_user_id, company_user_id, assigned_agent_user_id, first_intent,
    inquiry_status, master_lead_status, created_at, handoff_note
  `);

  if (isAgencyDev) {
    inqQuery = inqQuery.or(`company_user_id.eq.${userId},agency_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
  } else if (isAgentUser) {
    inqQuery = agentAssignedListingIds.length > 0
      ? inqQuery.or(`assigned_agent_user_id.eq.${userId},listing_id.in.(${agentAssignedListingIds.join(',')})`)
      : inqQuery.eq('assigned_agent_user_id', userId);
  } else {
    inqQuery = inqQuery.or(`buyer_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
  }

  const { data: rawInquiries, error: inqErr } = await inqQuery.order('created_at', { ascending: false });
  if (inqErr) throw inqErr;

  return {
    rawChatLeads: rawChatLeads || [],
    rawInquiries: rawInquiries || [],
    agentAssignedListingIds,
  };
}
