import { resolveAvatarUrl, resolveListingImageUrl } from '../../../lib/media-utils';

export function resolvePartnerUserId(
  participants: any[] | null,
  convRow: any,
  inquiryData: any,
  activeUserId: string,
  isViewerBuyer: boolean
): string | null {
  let partnerUserId: string | null = null;
  if (!isViewerBuyer) {
    const targetBuyerId = convRow?.buyer_user_id || inquiryData?.buyer_user_id;
    if (targetBuyerId && targetBuyerId !== activeUserId) {
      partnerUserId = targetBuyerId;
    } else {
      const buyerPart = (participants || []).find(
        (p: any) => p.participant_role === 'buyer' && p.user_id !== activeUserId
      );
      if (buyerPart?.user_id) partnerUserId = buyerPart.user_id;
    }
  } else {
    const targetAgencyId = convRow?.agency_user_id || inquiryData?.agency_user_id || inquiryData?.company_user_id;
    if (targetAgencyId && targetAgencyId !== activeUserId) {
      partnerUserId = targetAgencyId;
    }
  }

  if (!partnerUserId) {
    const otherParticipant = (participants || []).find((p: any) => p.user_id !== activeUserId);
    partnerUserId = otherParticipant?.user_id || null;
  }
  return partnerUserId;
}

export function resolveListingObject(
  resolvedListing: any,
  effectiveListingId: string | undefined,
  partnerSubtitleParam?: string
) {
  const isSubtitleGeneric =
    !partnerSubtitleParam ||
    partnerSubtitleParam === 'Direct Message' ||
    partnerSubtitleParam === 'Group Conversation' ||
    partnerSubtitleParam === 'DeltanHub Direct' ||
    partnerSubtitleParam.includes('participant') ||
    partnerSubtitleParam === 'Loading...';

  let listing = resolvedListing;
  if (!listing?.title && !isSubtitleGeneric && effectiveListingId) {
    listing = {
      id: effectiveListingId,
      title: partnerSubtitleParam,
      imageUrl: null,
    };
  }

  if (!listing) return null;

  return {
    id: listing.id || effectiveListingId,
    title: listing.title,
    imageUrl: resolveListingImageUrl(
      listing.imageUrl || listing.homepage_image_url || listing.cover_image_url
    ),
    address: listing.address,
    city: listing.city,
    state: listing.state,
    listingType: listing.listingType || listing.listing_type,
    listingStatus: listing.listingStatus || listing.listing_status,
    referenceCode: listing.referenceCode || listing.reference_code,
  };
}

export function resolveAssignmentObject(
  inquiryData: any,
  isViewerProfessional: boolean,
  hasAssignedAgent: boolean,
  effectiveAgentUserId: string | null,
  assignedAgentName: string,
  assignedAgentAvatar: string | null,
  convRow: any,
  activeUserId: string,
  conversationId: string
) {
  if (inquiryData && isViewerProfessional && hasAssignedAgent) {
    return {
      id: inquiryData.id,
      inquiryId: inquiryData.id,
      leadId: inquiryData.id,
      status: inquiryData.master_lead_status || inquiryData.inquiry_status || 'new',
      masterLeadStatus: inquiryData.master_lead_status || inquiryData.inquiry_status || 'new',
      assignedAgentUserId: inquiryData.assigned_agent_user_id || effectiveAgentUserId,
      assignedAgentName: (inquiryData.assigned_agent_user_id || effectiveAgentUserId) ? assignedAgentName : null,
      assignedAgentAvatar: (inquiryData.assigned_agent_user_id || effectiveAgentUserId) ? assignedAgentAvatar : null,
      assignedByUserId: inquiryData.company_user_id || inquiryData.agency_user_id || convRow?.agency_user_id || activeUserId,
      assignedAt: inquiryData.assigned_at || inquiryData.created_at || convRow?.updated_at || null,
      agencyUserId: inquiryData.agency_user_id || inquiryData.company_user_id || convRow?.agency_user_id || activeUserId,
      agentShareEnabled: Boolean(inquiryData.agent_share_enabled),
      handoffNote: inquiryData.handoff_note || null,
      agent: (inquiryData.assigned_agent_user_id || effectiveAgentUserId)
        ? {
            userId: inquiryData.assigned_agent_user_id || effectiveAgentUserId,
            fullName: assignedAgentName,
            avatarUrl: assignedAgentAvatar,
          }
        : null,
    };
  }

  if (isViewerProfessional && effectiveAgentUserId) {
    return {
      id: `listing_inq_${conversationId}`,
      inquiryId: `listing_inq_${conversationId}`,
      leadId: `listing_inq_${conversationId}`,
      status: 'new',
      masterLeadStatus: 'new',
      assignedAgentUserId: effectiveAgentUserId,
      assignedAgentName: assignedAgentName,
      assignedAgentAvatar: assignedAgentAvatar,
      assignedByUserId: convRow?.agency_user_id || activeUserId,
      assignedAt: convRow?.updated_at || null,
      agencyUserId: convRow?.agency_user_id || activeUserId,
      agentShareEnabled: false,
      handoffNote: null,
      agent: {
        userId: effectiveAgentUserId,
        fullName: assignedAgentName,
        avatarUrl: assignedAgentAvatar,
      },
    };
  }

  return null;
}
