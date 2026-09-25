import { supabase } from '../../supabase';
import { AppProfile } from '../../auth';
import type { ChatConversation } from '../../../components/chat/ConversationRow';
import { FetchInboxOptions } from './types';
import { mapToChatConversation } from './conversationMapper';

export async function fetchInboxConversations(
  currentUserId: string,
  currentProfile: AppProfile | null,
  options?: FetchInboxOptions
): Promise<ChatConversation[]> {
  const { data: participations, error: partErr } = await supabase
    .from('chat_participants')
    .select('conversation_id, participant_role, last_read_at, archived_at, muted_until, pinned_at, favorited_at, cleared_history_at')
    .eq('user_id', currentUserId)
    .is('removed_at', null);

  if (partErr) throw partErr;
  const convIds = (participations || []).map((p) => p.conversation_id);
  if (convIds.length === 0) return [];

  const { data: convRows, error: convErr } = await supabase
    .from('chat_conversations')
    .select(`
      id, conversation_kind, updated_at,
      listing_id, buyer_user_id, agency_user_id, recipient_user_id,
      context_snapshot, last_message_preview, last_message_at
    `)
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  if (convErr) throw convErr;

  const { data: inquiryRows } = await supabase
    .from('crm_inquiries')
    .select(`
      id, conversation_id, listing_id, buyer_user_id, recipient_user_id,
      agency_user_id, company_user_id, assigned_agent_user_id,
      assigned_by_user_id, assigned_at, master_lead_status,
      agent_share_enabled, handoff_note, inquiry_status
    `)
    .in('conversation_id', convIds);

  const inquiryMap = new Map<string, any>();
  inquiryRows?.forEach((inq: any) => { if (inq.conversation_id) inquiryMap.set(inq.conversation_id, inq); });

  const allListingIds: string[] = [];
  convRows?.forEach((c: any) => { if (c.listing_id) allListingIds.push(c.listing_id); });
  inquiryRows?.forEach((inq: any) => { if (inq.listing_id) allListingIds.push(inq.listing_id); });

  const listingSubmissionsMap = new Map<string, any>();
  if (allListingIds.length > 0) {
    const { data: listingRows } = await supabase
      .from('listing_submissions')
      .select('id, title, homepage_image_url, assigned_agent_user_id, address, city, state, listing_type, listing_status, reference_code')
      .in('id', Array.from(new Set(allListingIds)));
    listingRows?.forEach((l: any) => listingSubmissionsMap.set(l.id, l));
  }

  const { data: allParticipants } = await supabase
    .from('chat_participants')
    .select('conversation_id, user_id, participant_role')
    .in('conversation_id', convIds);

  const partnerUserIds = Array.from(new Set(
    (allParticipants || []).filter((p) => p.user_id !== currentUserId).map((p) => p.user_id).filter((id): id is string => Boolean(id))
  ));

  const userIdsToResolve = new Set<string>(partnerUserIds);
  inquiryRows?.forEach((inq: any) => {
    if (inq.buyer_user_id) userIdsToResolve.add(inq.buyer_user_id);
    if (inq.agency_user_id) userIdsToResolve.add(inq.agency_user_id);
    if (inq.company_user_id) userIdsToResolve.add(inq.company_user_id);
    if (inq.assigned_agent_user_id) userIdsToResolve.add(inq.assigned_agent_user_id);
  });
  listingSubmissionsMap.forEach((l: any) => { if (l.assigned_agent_user_id) userIdsToResolve.add(l.assigned_agent_user_id); });
  convRows?.forEach((c: any) => {
    if (c.buyer_user_id) userIdsToResolve.add(c.buyer_user_id);
    if (c.agency_user_id) userIdsToResolve.add(c.agency_user_id);
    if (c.recipient_user_id) userIdsToResolve.add(c.recipient_user_id);
    const snapAgentId = c.context_snapshot?.listing?.assigned_agent_user_id;
    if (snapAgentId) userIdsToResolve.add(snapAgentId);
  });

  const profileMap = new Map<string, any>();
  if (userIdsToResolve.size > 0) {
    const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
      requested_user_ids: Array.from(userIdsToResolve),
    });
    profiles?.forEach((p: any) => profileMap.set(p.user_id, p));
  }

  const limit = options?.maxMsgLimit ?? Math.min(200, Math.max(50, convIds.length * 4));
  const { data: latestMessages } = await supabase
    .from('chat_messages')
    .select('conversation_id, body, message_kind, created_at, sender_user_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  const lastMsgMap = new Map<string, any>();
  const unreadMap = new Map<string, number>();
  const partMap = new Map(participations?.map((p) => [p.conversation_id, p]));

  latestMessages?.forEach((msg) => {
    const part = partMap.get(msg.conversation_id);
    if (part?.cleared_history_at && msg.created_at <= part.cleared_history_at) return;
    if (!lastMsgMap.has(msg.conversation_id)) lastMsgMap.set(msg.conversation_id, msg);
    const lastReadTime = part?.last_read_at ? new Date(part.last_read_at).getTime() : 0;
    const msgTime = new Date(msg.created_at).getTime();
    if (msg.sender_user_id !== currentUserId && msgTime > lastReadTime) {
      unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
    }
  });

  const mapped: ChatConversation[] = (convRows || []).map((c: any) =>
    mapToChatConversation({
      c,
      part: partMap.get(c.id),
      inq: inquiryMap.get(c.id),
      allParticipants: allParticipants || [],
      profileMap,
      listingSubmissionsMap,
      lastMsg: lastMsgMap.get(c.id),
      unreadCount: unreadMap.get(c.id) || 0,
      currentUserId,
      currentProfile,
    })
  );

  mapped.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) {
      const aPin = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bPin = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      if (bPin !== aPin) return bPin - aPin;
    }
    const stampA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const stampB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return stampB - stampA;
  });

  return mapped;
}
