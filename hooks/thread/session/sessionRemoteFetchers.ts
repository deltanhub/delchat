import { supabase } from '../../../lib/supabase';
import { resolveAvatarUrl } from '../../../lib/media-utils';
import { conversationRepository } from '../../../lib/repositories';

export async function fetchPartnerProfile(
  partnerUserId: string | null,
  fallbackName: string
): Promise<{ name: string; avatarUrl: string | null; lastSeenAt: string | null }> {
  if (!partnerUserId) {
    return { name: fallbackName, avatarUrl: null, lastSeenAt: null };
  }
  const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
    requested_user_ids: [partnerUserId],
  });
  if (profiles && profiles[0]) {
    return {
      name: profiles[0].display_name?.trim() || profiles[0].full_name?.trim() || fallbackName,
      avatarUrl: resolveAvatarUrl(profiles[0].avatar_url),
      lastSeenAt: profiles[0].last_seen_at || null,
    };
  }
  return { name: fallbackName, avatarUrl: null, lastSeenAt: null };
}

export async function fetchListingFallback(
  resolvedListing: any,
  effectiveListingId: string | undefined
) {
  if ((!resolvedListing?.title || !resolvedListing?.address) && effectiveListingId) {
    const { data: listingData } = await supabase
      .from('listing_submissions')
      .select('*')
      .eq('id', effectiveListingId)
      .maybeSingle();
    if (listingData) {
      return {
        ...resolvedListing,
        ...listingData,
        imageUrl: listingData.homepage_image_url || resolvedListing?.imageUrl,
      };
    }
  }
  return resolvedListing;
}

export async function fetchAgentProfile(
  effectiveAgentUserId: string | null
): Promise<{ name: string; avatarUrl: string | null }> {
  if (!effectiveAgentUserId) {
    return { name: 'Assigned Agent', avatarUrl: null };
  }
  const { data: agentProfiles } = await supabase.rpc('get_public_user_profiles', {
    requested_user_ids: [effectiveAgentUserId],
  });
  if (agentProfiles && agentProfiles[0]) {
    return {
      name: agentProfiles[0].display_name?.trim() || agentProfiles[0].full_name?.trim() || 'Assigned Agent',
      avatarUrl: resolveAvatarUrl(agentProfiles[0].avatar_url),
    };
  }
  return { name: 'Assigned Agent', avatarUrl: null };
}

export async function checkBlockStatus(
  activeUserId: string,
  partnerUserId: string | null
): Promise<{ isBlocked: boolean; blockedByMe: boolean }> {
  if (partnerUserId && activeUserId) {
    try {
      const blockInfo = await conversationRepository.checkChatBlockedStatus(activeUserId, partnerUserId);
      return { isBlocked: blockInfo.isBlocked, blockedByMe: blockInfo.blockedByMe };
    } catch {
      return { isBlocked: false, blockedByMe: false };
    }
  }
  return { isBlocked: false, blockedByMe: false };
}
