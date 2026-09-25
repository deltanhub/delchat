import { SupabaseClient } from '@supabase/supabase-js';
import { resolveAvatarUrl } from '../../../lib/media-utils';
import { ChatLeadItem } from '../types';

export async function fetchAgentAssignedListingIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase.from('listing_submissions').select('id').eq('assigned_agent_user_id', userId);
  return (data || []).map((l: any) => l.id).filter(Boolean);
}

export async function fetchOrgMemberIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data: agencyMembers } = await supabase
    .from('agency_agent_memberships')
    .select('agent_user_id')
    .eq('agency_user_id', userId)
    .eq('membership_status', 'active');

  const { data: devMembers } = await supabase
    .from('developer_agent_memberships')
    .select('agent_user_id')
    .eq('developer_user_id', userId)
    .eq('membership_status', 'active');

  return [
    userId,
    ...(agencyMembers?.map((m: any) => m.agent_user_id) || []),
    ...(devMembers?.map((m: any) => m.agent_user_id) || []),
  ];
}

export async function resolveListingMetadata(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<{
  listingTitleMap: Map<string, string>;
  listingAgentMap: Map<string, string>;
  listingAssignedAgentIds: string[];
}> {
  const listingTitleMap = new Map<string, string>();
  const listingAgentMap = new Map<string, string>();
  const listingAssignedAgentIds: string[] = [];

  if (listingIds.length === 0) return { listingTitleMap, listingAgentMap, listingAssignedAgentIds };

  const { data: listingRows } = await supabase
    .from('listing_submissions')
    .select('id, title, assigned_agent_user_id')
    .in('id', listingIds);

  (listingRows || []).forEach((lr: any) => {
    if (lr.id && lr.title) listingTitleMap.set(lr.id, lr.title);
    if (lr.id && lr.assigned_agent_user_id) {
      listingAgentMap.set(lr.id, lr.assigned_agent_user_id);
      listingAssignedAgentIds.push(lr.assigned_agent_user_id);
    }
  });

  return { listingTitleMap, listingAgentMap, listingAssignedAgentIds };
}

export async function resolveBuyerNames(supabase: SupabaseClient, buyerIds: string[]): Promise<Map<string, string>> {
  const buyerNameMap = new Map<string, string>();
  if (buyerIds.length === 0) return buyerNameMap;

  const { data: buyerProfiles } = await supabase.rpc('get_public_user_profiles', { requested_user_ids: buyerIds });
  (buyerProfiles || []).forEach((bp: any) => {
    buyerNameMap.set(bp.user_id, bp.display_name?.trim() || bp.full_name?.trim() || 'Client');
  });

  return buyerNameMap;
}

export async function resolveAgentProfiles(
  supabase: SupabaseClient,
  agentIds: string[]
): Promise<Map<string, { fullName: string; avatarUrl: string | null }>> {
  const agentMap = new Map<string, { fullName: string; avatarUrl: string | null }>();
  if (agentIds.length === 0) return agentMap;

  const { data: agentProfiles } = await supabase.rpc('get_public_user_profiles', { requested_user_ids: agentIds });
  (agentProfiles || []).forEach((ap: any) => {
    agentMap.set(ap.user_id, {
      fullName: ap.display_name?.trim() || ap.full_name?.trim() || 'Agent',
      avatarUrl: resolveAvatarUrl(ap.avatar_url),
    });
  });

  return agentMap;
}

export function appendStandaloneInquiries(
  rawInquiries: any[],
  mappedChatLeads: ChatLeadItem[],
  listingAgentMap: Map<string, string>,
  agentMap: Map<string, { fullName: string; avatarUrl: string | null }>,
  buyerNameMap: Map<string, string>,
  listingTitleMap: Map<string, string>
): void {
  const existingConvIds = new Set(mappedChatLeads.map((m) => m.conversationId).filter(Boolean));
  (rawInquiries || []).forEach((inq: any) => {
    if (!existingConvIds.has(inq.conversation_id)) {
      const normStatus = inq.inquiry_status === 'closed' ? 'converted' : inq.inquiry_status === 'lost' ? 'closed_lost' : inq.inquiry_status;
      const targetListingId = inq.listing_id || null;
      const listingAssignedAgent = targetListingId ? listingAgentMap.get(targetListingId) : null;
      const assignedUserId = inq.assigned_agent_user_id || listingAssignedAgent || null;
      const agentProfile = assignedUserId ? agentMap.get(assignedUserId) : null;
      mappedChatLeads.push({
        id: inq.id,
        conversationId: inq.conversation_id,
        inquiryId: inq.id,
        listingId: targetListingId,
        listingTitle: targetListingId ? listingTitleMap.get(targetListingId) || null : null,
        source: 'Property inquiry',
        fullName: buyerNameMap.get(inq.buyer_user_id) || 'Prospective Buyer',
        email: null,
        phone: null,
        note: inq.first_intent || inq.handoff_note || null,
        status: (normStatus as ChatLeadItem['status']) || 'new',
        assignedToUserId: assignedUserId,
        assignedAgentName: agentProfile?.fullName || null,
        assignedAgentAvatarUrl: agentProfile?.avatarUrl || null,
        createdByUserId: inq.company_user_id || inq.agency_user_id || inq.buyer_user_id,
        createdAt: inq.created_at,
        masterLeadStatus: inq.master_lead_status || normStatus || 'new',
      });
    }
  });
}
