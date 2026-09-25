import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getCurrentProfile, canReceiveLeads } from '../../../lib/auth';
import { OfflineEngine } from '../../../lib/offline-engine';
import type { ChatConversation } from '../../../components/chat/ConversationRow';
import {
  resolvePartnerUserId,
  resolveListingObject,
  resolveAssignmentObject,
} from './sessionResolutionHelper';
import {
  fetchPartnerProfile,
  fetchListingFallback,
  fetchAgentProfile,
  checkBlockStatus,
} from './sessionRemoteFetchers';

export function useConversationDetailsFetch(
  conversationId: string,
  partnerNameParam: string | undefined,
  titleParam: string | undefined,
  partnerSubtitleParam: string | undefined,
  listingIdParam: string | undefined,
  currentUserRef: React.MutableRefObject<any>,
  currentProfileRef: React.MutableRefObject<any>,
  setConversation: React.Dispatch<React.SetStateAction<ChatConversation | null>>,
  fetchInquiryCounts: (inquiryId: string) => Promise<void>
) {
  const router = useRouter();

  return useCallback(async (userOverride?: any) => {
    const activeUser = userOverride || currentUserRef.current;
    if (!conversationId || !activeUser) return;
    try {
      const { data: convRow } = await supabase
        .from('chat_conversations')
        .select('id, conversation_kind, updated_at, listing_id, buyer_user_id, agency_user_id, context_snapshot, last_message_preview, last_message_at')
        .eq('id', conversationId)
        .maybeSingle();

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, participant_role, last_read_at, muted_until, pinned_at, archived_at, removed_at')
        .eq('conversation_id', conversationId)
        .is('removed_at', null);

      if (!(participants || []).some((p: any) => p.user_id === activeUser.id)) {
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        router.replace('/(tabs)');
        return;
      }

      const { data: inquiryData } = await supabase
        .from('crm_inquiries')
        .select('id, inquiry_status, master_lead_status, buyer_user_id, listing_id, assigned_agent_user_id, agency_user_id, company_user_id, agent_share_enabled, handoff_note, assigned_at, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentParticipant = (participants || []).find((p: any) => p.user_id === activeUser.id);
      const isViewerBuyer = currentParticipant?.participant_role === 'buyer' || (!convRow?.agency_user_id && convRow?.buyer_user_id === activeUser.id);
      const partnerUserId = resolvePartnerUserId(participants, convRow, inquiryData, activeUser.id, isViewerBuyer);

      const partnerProfile = await fetchPartnerProfile(partnerUserId, partnerNameParam || 'Member');
      const partnerName = partnerProfile.name;
      const partnerAvatarUrl = partnerProfile.avatarUrl;
      const partnerLastSeenAt = partnerProfile.lastSeenAt;

      let resolvedListing = convRow?.context_snapshot?.listing || (convRow?.context_snapshot?.title ? convRow.context_snapshot : null);
      const effectiveListingId = listingIdParam || convRow?.listing_id || inquiryData?.listing_id || convRow?.context_snapshot?.listing_id || convRow?.context_snapshot?.id || resolvedListing?.id;
      resolvedListing = await fetchListingFallback(resolvedListing, effectiveListingId);

      const listingObj = resolveListingObject(resolvedListing, effectiveListingId, partnerSubtitleParam);
      const isGroup = convRow?.conversation_kind === 'group';
      const participantCount = participants ? participants.length : 2;

      const effectiveAgentUserId = inquiryData?.assigned_agent_user_id || resolvedListing?.assigned_agent_user_id || null;
      const agentProfile = await fetchAgentProfile(effectiveAgentUserId);

      const profile = currentProfileRef.current || (await getCurrentProfile());
      const isViewerProfessional = canReceiveLeads(profile?.mainRole);
      const canAssignAgentsInThread = Boolean(convRow?.agency_user_id && convRow.agency_user_id === activeUser.id) || Boolean(inquiryData?.company_user_id && inquiryData.company_user_id === activeUser.id);
      const assignmentObj = resolveAssignmentObject(inquiryData, isViewerProfessional, Boolean(effectiveAgentUserId), effectiveAgentUserId, agentProfile.name, agentProfile.avatarUrl, convRow, activeUser.id, conversationId);

      const { isBlocked, blockedByMe } = await checkBlockStatus(activeUser.id, partnerUserId);
      const isArchived = Boolean(currentParticipant?.archived_at);

      const updatedConversation: ChatConversation = {
        id: conversationId,
        conversationKind: (convRow?.conversation_kind as ChatConversation['conversationKind']) || 'direct',
        title: titleParam || partnerName,
        preview: convRow?.last_message_preview || '',
        updatedAt: convRow?.updated_at || null,
        unreadCount: 0,
        latestIntent: 'general',
        partnerName,
        partnerSubtitle: listingObj?.title || partnerSubtitleParam || (isGroup ? `${participantCount} participants` : 'Direct Message'),
        partnerAvatarUrl,
        partnerUserId,
        partnerLastSeenAt,
        isGroup,
        participantCount,
        isArchived,
        isMuted: currentParticipant?.muted_until ? new Date(currentParticipant.muted_until) > new Date() : false,
        isPinned: Boolean(currentParticipant?.pinned_at),
        isBlocked,
        blockedByMe,
        listing: listingObj,
        inquiryId: inquiryData?.id || null,
        agencyName: null,
        assignedAgent: effectiveAgentUserId ? { userId: effectiveAgentUserId, fullName: agentProfile.name, avatarUrl: agentProfile.avatarUrl } : null,
        assignment: assignmentObj,
        canAssignAgents: canAssignAgentsInThread,
      };

      setConversation((prevConv) => {
        const finalListing = updatedConversation.listing || prevConv?.listing || null;
        const merged: ChatConversation = {
          ...updatedConversation,
          listing: finalListing,
          partnerSubtitle: finalListing?.title || updatedConversation.partnerSubtitle,
          assignment: updatedConversation.assignment || (isViewerProfessional ? prevConv?.assignment : null) || null,
        };
        OfflineEngine.saveSingleConversation(merged);
        return merged;
      });

      if (assignmentObj?.id) void fetchInquiryCounts(assignmentObj.id);
    } catch (err) {
      console.warn('Failed to load conversation details', err);
    }
  }, [conversationId, partnerNameParam, titleParam, partnerSubtitleParam, listingIdParam, currentUserRef, currentProfileRef, router, setConversation, fetchInquiryCounts]);
}
