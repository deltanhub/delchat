import { resolveAvatarUrl, resolveListingImageUrl } from '../../media-utils';
import { AppProfile } from '../../auth';
import type { ChatConversation } from '../../../components/chat/ConversationRow';
import { resolveAssignmentObject } from './assignmentResolver';

export interface MapConversationParams {
  c: any;
  part: any;
  inq: any;
  allParticipants: any[];
  profileMap: Map<string, any>;
  listingSubmissionsMap: Map<string, any>;
  lastMsg: any;
  unreadCount: number;
  currentUserId: string;
  currentProfile: AppProfile | null;
}

export function mapToChatConversation({
  c,
  part,
  inq,
  allParticipants,
  profileMap,
  listingSubmissionsMap,
  lastMsg,
  unreadCount,
  currentUserId,
  currentProfile,
}: MapConversationParams): ChatConversation {
  const currentParticipantRole = part?.participant_role;
  const isViewerBuyer = currentParticipantRole === 'buyer' || (!c.agency_user_id && c.buyer_user_id === currentUserId);

  const canAssignAgentsInThread =
    Boolean(c.agency_user_id && c.agency_user_id === currentUserId) ||
    Boolean(inq?.company_user_id && inq.company_user_id === currentUserId);

  let partnerUserId: string | null = null;
  if (!isViewerBuyer) {
    const targetBuyerId = c.buyer_user_id || inq?.buyer_user_id;
    if (targetBuyerId && targetBuyerId !== currentUserId) {
      partnerUserId = targetBuyerId;
    } else {
      const buyerPart = (allParticipants || []).find(
        (p) => p.conversation_id === c.id && p.participant_role === 'buyer' && p.user_id !== currentUserId
      );
      if (buyerPart?.user_id) partnerUserId = buyerPart.user_id;
    }
  } else {
    const targetAgencyId = c.agency_user_id || inq?.agency_user_id || inq?.company_user_id;
    if (targetAgencyId && targetAgencyId !== currentUserId) {
      partnerUserId = targetAgencyId;
    }
  }

  if (!partnerUserId) {
    const otherPart = (allParticipants || []).find((p) => p.conversation_id === c.id && p.user_id !== currentUserId);
    partnerUserId = otherPart?.user_id || null;
  }

  const partnerProfile = partnerUserId ? profileMap.get(partnerUserId) : null;
  const snapshotListing = c.context_snapshot?.listing;
  const fallbackListing = (c.listing_id ? listingSubmissionsMap.get(c.listing_id) : null) || (inq?.listing_id ? listingSubmissionsMap.get(inq.listing_id) : null);
  const resolvedListing = snapshotListing || fallbackListing;

  const listingObj = resolvedListing ? {
    id: resolvedListing.id || c.listing_id || inq?.listing_id,
    title: resolvedListing.title,
    imageUrl: resolveListingImageUrl(resolvedListing.imageUrl || resolvedListing.homepage_image_url || resolvedListing.cover_image_url),
    address: resolvedListing.address,
    city: resolvedListing.city,
    state: resolvedListing.state,
    listingType: resolvedListing.listingType || resolvedListing.listing_type,
    listingStatus: resolvedListing.listingStatus || resolvedListing.listing_status,
    referenceCode: resolvedListing.referenceCode || resolvedListing.reference_code,
  } : null;

  const partnerName = partnerProfile?.display_name?.trim() || partnerProfile?.full_name?.trim() || listingObj?.title || (c.conversation_kind === 'group' ? 'Group Chat' : 'DeltanHub Member');
  const partnerAvatarUrl = partnerProfile?.avatar_url ? resolveAvatarUrl(partnerProfile.avatar_url) : null;

  const isHistoryCleared = Boolean(part?.cleared_history_at && c.last_message_at && c.last_message_at <= part.cleared_history_at);
  const preview = isHistoryCleared ? 'No messages yet' : lastMsg?.message_kind === 'voice_note' ? '🎤 Voice note' : lastMsg?.message_kind === 'attachments' ? '📎 Attachment' : lastMsg?.message_kind === 'listing_card' ? '🏡 Property Card' : lastMsg?.message_kind === 'inquiry_form' ? '📋 Inquiry Form' : lastMsg?.body || c.last_message_preview || 'No messages yet';

  const listingAssignedAgentId = resolvedListing?.assigned_agent_user_id || c.context_snapshot?.listing?.assigned_agent_user_id || null;
  const effectiveAgentUserId = inq?.assigned_agent_user_id || listingAssignedAgentId || null;

  let assignedAgentName: string | null = null;
  let assignedAgentAvatar: string | null = null;
  if (effectiveAgentUserId) {
    const agentProfile = profileMap.get(effectiveAgentUserId);
    if (agentProfile) {
      assignedAgentName = agentProfile.display_name?.trim() || agentProfile.full_name?.trim() || 'Assigned Agent';
      assignedAgentAvatar = resolveAvatarUrl(agentProfile.avatar_url);
    }
  }

  const assignmentObj = resolveAssignmentObject({
    inq,
    c,
    effectiveAgentUserId,
    assignedAgentName,
    assignedAgentAvatar,
    currentProfile,
  });

  const resolvedAgent = (inq?.assigned_agent_user_id || effectiveAgentUserId) ? {
    userId: (inq?.assigned_agent_user_id || effectiveAgentUserId) as string,
    fullName: assignedAgentName || 'Assigned Agent',
    avatarUrl: assignedAgentAvatar,
  } : null;

  const agencyUserId = inq?.company_user_id || inq?.agency_user_id || c.agency_user_id || null;
  const agencyProfile = agencyUserId ? profileMap.get(agencyUserId) : null;
  const agencyName = agencyProfile?.display_name?.trim() || agencyProfile?.full_name?.trim() || null;
  const isGroup = c.conversation_kind === 'group';

  return {
    id: c.id,
    conversationKind: c.conversation_kind || 'direct',
    title: partnerName,
    preview,
    updatedAt: lastMsg?.created_at || c.updated_at,
    unreadCount,
    latestIntent: lastMsg?.intent || 'general',
    partnerName,
    partnerSubtitle: listingObj?.title || (isGroup ? 'Group Conversation' : 'Direct Message'),
    partnerAvatarUrl,
    partnerUserId: partnerUserId || null,
    partnerLastSeenAt: partnerProfile?.last_seen_at || null,
    isGroup,
    participantCount: 2,
    isMuted: part?.muted_until ? new Date(part.muted_until) > new Date() : false,
    isPinned: Boolean(part?.pinned_at),
    isArchived: Boolean(part?.archived_at),
    pinnedAt: part?.pinned_at || null,
    isFavorited: Boolean(part?.favorited_at),
    favoritedAt: part?.favorited_at || null,
    clearedHistoryAt: part?.cleared_history_at || null,
    listing: listingObj,
    assignment: assignmentObj,
    inquiryId: inq?.id || null,
    agencyName,
    assignedAgent: resolvedAgent,
    canAssignAgents: canAssignAgentsInThread,
  };
}
