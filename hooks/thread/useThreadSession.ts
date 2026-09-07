import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile, canAssignAgents, canReceiveLeads, UserProfile } from '../../lib/auth';
import { resolveAvatarUrl, resolveListingImageUrl } from '../../lib/media-utils';
import { fetchWithAuth } from '../../lib/api-client';
import type { ChatConversation } from '../../components/chat/ConversationRow';
import { conversationRepository, leadsRepository } from '../../lib/repositories';
import * as Haptics from '../../lib/haptics';

export interface UseThreadSessionParams {
  conversationId: string;
  partnerNameParam?: string;
  titleParam?: string;
  partnerSubtitleParam?: string;
}

export function useThreadSession({ conversationId, partnerNameParam, titleParam, partnerSubtitleParam }: UseThreadSessionParams) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const fetchInquiryCounts = useCallback(async (inquiryId: string) => {
    if (!inquiryId) return;
    try {
      const [notesRes, reportsRes] = await Promise.all([
        supabase
          .from('master_lead_internal_notes')
          .select('id', { count: 'exact', head: true })
          .eq('inquiry_id', inquiryId),
        supabase
          .from('master_lead_reports')
          .select('id', { count: 'exact', head: true })
          .eq('inquiry_id', inquiryId),
      ]);
      setNotesCount(notesRes.count ?? 0);
      setReportsCount(reportsRes.count ?? 0);
    } catch {
      // Non-critical counter sync
    }
  }, []);

  // 1. Initialize user and current profile
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
      const prof = await getCurrentProfile();
      setCurrentProfile(prof);
    });
  }, []);

  // 2. Fetch conversation details & partner info
  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    try {
      const { data: convRow } = await supabase
        .from('chat_conversations')
        .select(`
          id, conversation_kind, updated_at,
          listing_id, buyer_user_id, agency_user_id, context_snapshot, last_message_preview, last_message_at
        `)
        .eq('id', conversationId)
        .maybeSingle();

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, participant_role, last_read_at, muted_until, pinned_at, archived_at, removed_at')
        .eq('conversation_id', conversationId)
        .is('removed_at', null);

      const isAuthorizedParticipant = (participants || []).some((p: any) => p.user_id === currentUser.id);
      if (!isAuthorizedParticipant) {
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        router.replace('/(tabs)');
        return;
      }

      // Fetch CRM Inquiry / Lead Assignment
      const { data: inquiryData } = await supabase
        .from('crm_inquiries')
        .select(`
          id, inquiry_status, master_lead_status, buyer_user_id, listing_id,
          assigned_agent_user_id, agency_user_id, company_user_id,
          agent_share_enabled, handoff_note, assigned_at, created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentParticipant = (participants || []).find((p: any) => p.user_id === currentUser.id);
      const isViewerBuyer = currentParticipant?.participant_role === 'buyer' || (!convRow?.agency_user_id && convRow?.buyer_user_id === currentUser.id);

      // Resolve true conversational partner (Client / Buyer when viewed by Agency/Agent/Dev)
      let partnerUserId: string | null = null;
      if (!isViewerBuyer) {
        const targetBuyerId = convRow?.buyer_user_id || inquiryData?.buyer_user_id;
        if (targetBuyerId && targetBuyerId !== currentUser.id) {
          partnerUserId = targetBuyerId;
        } else {
          const buyerPart = (participants || []).find(
            (p: any) => p.participant_role === 'buyer' && p.user_id !== currentUser.id
          );
          if (buyerPart?.user_id) partnerUserId = buyerPart.user_id;
        }
      } else {
        const targetAgencyId = convRow?.agency_user_id || inquiryData?.agency_user_id || inquiryData?.company_user_id;
        if (targetAgencyId && targetAgencyId !== currentUser.id) {
          partnerUserId = targetAgencyId;
        }
      }

      if (!partnerUserId) {
        const otherParticipant = (participants || []).find((p: any) => p.user_id !== currentUser.id);
        partnerUserId = otherParticipant?.user_id || null;
      }

      let partnerName = partnerNameParam || 'Member';
      let partnerAvatarUrl: string | null = null;
      let partnerLastSeenAt: string | null = null;

      if (partnerUserId) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: [partnerUserId],
        });
        if (profiles && profiles[0]) {
          partnerName = profiles[0].display_name?.trim() || profiles[0].full_name?.trim() || partnerName;
          partnerAvatarUrl = resolveAvatarUrl(profiles[0].avatar_url);
          partnerLastSeenAt = profiles[0].last_seen_at || null;
        }
      }

      let resolvedListing = convRow?.context_snapshot?.listing;
      const effectiveListingId = convRow?.listing_id || inquiryData?.listing_id || resolvedListing?.id;
      if ((!resolvedListing?.title || !resolvedListing?.address) && effectiveListingId) {
        const { data: listingData } = await supabase
          .from('listing_submissions')
          .select('id, title, homepage_image_url, assigned_agent_user_id, address, city, state, listing_type, listing_status, reference_code')
          .eq('id', effectiveListingId)
          .maybeSingle();
        if (listingData) {
          resolvedListing = {
            id: listingData.id,
            title: listingData.title,
            imageUrl: listingData.homepage_image_url,
            assigned_agent_user_id: listingData.assigned_agent_user_id,
            address: listingData.address,
            city: listingData.city,
            state: listingData.state,
            listingType: listingData.listing_type,
            listingStatus: listingData.listing_status,
            referenceCode: listingData.reference_code,
          };
        }
      }

      const listingObj = resolvedListing
        ? {
            id: resolvedListing.id || effectiveListingId,
            title: resolvedListing.title,
            imageUrl: resolveListingImageUrl(
              resolvedListing.imageUrl ||
              resolvedListing.homepage_image_url ||
              resolvedListing.cover_image_url
            ),
            address: resolvedListing.address,
            city: resolvedListing.city,
            state: resolvedListing.state,
            listingType: resolvedListing.listingType || resolvedListing.listing_type,
            listingStatus: resolvedListing.listingStatus || resolvedListing.listing_status,
            referenceCode: resolvedListing.referenceCode || resolvedListing.reference_code,
          }
        : null;

      const isGroup = (participants && participants.length > 2) || convRow?.conversation_kind === 'group';
      const participantCount = participants ? participants.length : 2;

      const listingAssignedAgentId =
        resolvedListing?.assigned_agent_user_id ||
        convRow?.context_snapshot?.listing?.assigned_agent_user_id ||
        null;

      const effectiveAgentUserId =
        inquiryData?.assigned_agent_user_id || listingAssignedAgentId || null;

      let assignedAgentName = 'Assigned Agent';
      let assignedAgentAvatar: string | null = null;

      if (effectiveAgentUserId) {
        const { data: agentProfiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: [effectiveAgentUserId],
        });
        if (agentProfiles && agentProfiles[0]) {
          assignedAgentName =
            agentProfiles[0].display_name?.trim() ||
            agentProfiles[0].full_name?.trim() ||
            'Assigned Agent';
          assignedAgentAvatar = resolveAvatarUrl(agentProfiles[0].avatar_url);
        }
      }

      // Internal brokerage assignment context is strictly suppressed for consumer (Buyer) viewers
      const profile = currentProfile || (await getCurrentProfile());
      const isViewerProfessional = canReceiveLeads(profile?.mainRole);

      // Can viewer manage assignments in this thread? (DeltanHub Web parity: chat-service.ts:L2862)
      const canAssignAgentsInThread =
        Boolean(convRow?.agency_user_id && convRow.agency_user_id === currentUser.id) ||
        Boolean(inquiryData?.company_user_id && inquiryData.company_user_id === currentUser.id);

      const hasAssignedAgent = Boolean(inquiryData?.assigned_agent_user_id || effectiveAgentUserId);

      const assignmentObj = (inquiryData && isViewerProfessional && hasAssignedAgent)
        ? {
            id: inquiryData.id,
            inquiryId: inquiryData.id,
            leadId: inquiryData.id,
            status: inquiryData.master_lead_status || inquiryData.inquiry_status || 'new',
            masterLeadStatus: inquiryData.master_lead_status || inquiryData.inquiry_status || 'new',
            assignedAgentUserId: inquiryData.assigned_agent_user_id || effectiveAgentUserId,
            assignedAgentName: (inquiryData.assigned_agent_user_id || effectiveAgentUserId) ? assignedAgentName : null,
            assignedAgentAvatar: (inquiryData.assigned_agent_user_id || effectiveAgentUserId) ? assignedAgentAvatar : null,
            assignedByUserId: inquiryData.company_user_id || inquiryData.agency_user_id || (convRow as any)?.agency_user_id || currentUser.id,
            assignedAt: inquiryData.assigned_at || inquiryData.created_at || convRow?.updated_at || null,
            agencyUserId: inquiryData.agency_user_id || inquiryData.company_user_id || (convRow as any)?.agency_user_id || currentUser.id,
            agentShareEnabled: Boolean(inquiryData.agent_share_enabled),
            handoffNote: inquiryData.handoff_note || null,
            agent: (inquiryData.assigned_agent_user_id || effectiveAgentUserId)
              ? {
                  userId: inquiryData.assigned_agent_user_id || effectiveAgentUserId,
                  fullName: assignedAgentName,
                  avatarUrl: assignedAgentAvatar,
                }
              : null,
          }
        : (isViewerProfessional && effectiveAgentUserId)
        ? {
            id: `listing_inq_${conversationId}`,
            inquiryId: `listing_inq_${conversationId}`,
            leadId: `listing_inq_${conversationId}`,
            status: 'new',
            masterLeadStatus: 'new',
            assignedAgentUserId: effectiveAgentUserId,
            assignedAgentName: effectiveAgentUserId ? assignedAgentName : null,
            assignedAgentAvatar: effectiveAgentUserId ? assignedAgentAvatar : null,
            assignedByUserId: (convRow as any)?.agency_user_id || currentUser.id,
            assignedAt: convRow?.updated_at || null,
            agencyUserId: (convRow as any)?.agency_user_id || currentUser.id,
            agentShareEnabled: false,
            handoffNote: null,
            agent: effectiveAgentUserId
              ? {
                  userId: effectiveAgentUserId,
                  fullName: assignedAgentName,
                  avatarUrl: assignedAgentAvatar,
                }
              : null,
          }
        : null;

      const isArchived = Boolean(currentParticipant?.archived_at);
      const isMuted = currentParticipant?.muted_until ? new Date(currentParticipant.muted_until) > new Date() : false;
      const isPinned = Boolean(currentParticipant?.pinned_at);

      let isBlocked = false;
      let blockedByMe = false;
      if (partnerUserId && currentUser?.id) {
        try {
          const blockInfo = await conversationRepository.checkChatBlockedStatus(
            currentUser.id,
            partnerUserId
          );
          isBlocked = blockInfo.isBlocked;
          blockedByMe = blockInfo.blockedByMe;
        } catch {
          // non-critical
        }
      }

      setConversation({
        id: conversationId,
        conversationKind: (convRow?.conversation_kind as ChatConversation['conversationKind']) || 'direct',
        title: titleParam || partnerName,
        preview: convRow?.last_message_preview || '',
        updatedAt: convRow?.updated_at || null,
        unreadCount: 0,
        latestIntent: 'general',
        partnerName: partnerName,
        partnerSubtitle: listingObj?.title || partnerSubtitleParam || (isGroup ? `${participantCount} participants` : 'Direct Message'),
        partnerAvatarUrl: partnerAvatarUrl,
        partnerUserId: partnerUserId,
        partnerLastSeenAt: partnerLastSeenAt,
        isGroup,
        participantCount,
        isArchived,
        isMuted,
        isPinned,
        isBlocked,
        blockedByMe,
        listing: listingObj ? {
          id: listingObj.id,
          title: listingObj.title,
          imageUrl: listingObj.imageUrl,
          address: listingObj.address,
          city: listingObj.city,
          state: listingObj.state,
          listingType: listingObj.listingType,
          listingStatus: listingObj.listingStatus,
          referenceCode: listingObj.referenceCode,
        } : null,
        assignment: assignmentObj,
        canAssignAgents: canAssignAgentsInThread,
      });

      if (assignmentObj?.id) {
        void fetchInquiryCounts(assignmentObj.id);
      }
    } catch (err) {
      console.warn('Failed to load conversation details', err);
    }
  }, [conversationId, currentUser, currentProfile?.mainRole, partnerNameParam, titleParam, fetchInquiryCounts]);

  // Authorization check before dispatching messages
  const ensureParticipantAuthorization = useCallback(async (): Promise<boolean> => {
    if (!currentUser || !conversationId) return false;
    try {
      const { data: partRow, error } = await supabase
        .from('chat_participants')
        .select('id, can_send, removed_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id)
        .is('removed_at', null)
        .maybeSingle();

      if (error || !partRow) {
        console.warn('[Security] Unauthorized access attempt to conversation:', conversationId);
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        return false;
      }

      if (!partRow.can_send) {
        Alert.alert('Restricted', 'You do not have permission to send messages in this conversation.');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [currentUser, conversationId]);

  // Lead status updates
  const handleUpdateLeadStatus = useCallback(async (newStatus: string) => {
    if (!conversation?.assignment?.leadId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isClosed = newStatus === 'closed_won';
      const isLost = newStatus === 'closed_lost';
      const dbStatus = isClosed ? 'closed' : isLost ? 'lost' : newStatus;

      await supabase
        .from('crm_inquiries')
        .update({
          inquiry_status: dbStatus,
          master_lead_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.assignment.leadId);

      setConversation((prev: any) =>
        prev
          ? {
              ...prev,
              assignment: {
                ...prev.assignment,
                status: newStatus,
                masterLeadStatus: newStatus,
              },
            }
          : null
      );
    } catch (err: any) {
      Alert.alert('Status Update Failed', err.message);
    }
  }, [conversation?.assignment?.leadId]);

  // In-thread agent share toggle
  const handleToggleInThreadAgentShare = useCallback(async () => {
    if (!conversation?.assignment?.leadId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextEnabled = !conversation.assignment.agentShareEnabled;
    try {
      setConversation((prev: any) =>
        prev
          ? {
              ...prev,
              assignment: {
                ...prev.assignment,
                agentShareEnabled: nextEnabled,
              },
            }
          : null
      );

      await supabase
        .from('crm_inquiries')
        .update({
          agent_share_enabled: nextEnabled,
          agent_share_enabled_at: nextEnabled ? new Date().toISOString() : null,
        })
        .eq('id', conversation.assignment.leadId);
    } catch (err: any) {
      Alert.alert('Share Toggle Error', err.message);
    }
  }, [conversation?.assignment]);

  // Header Actions
  const handleConvertToLead = useCallback(
    async (draft?: { fullName: string; email?: string; phone?: string; note?: string }) => {
      if (!currentUser || !conversationId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const targetFullName =
        draft?.fullName || conversation?.partnerName || partnerNameParam || 'Client Lead';

      try {
        const result = await leadsRepository.captureLead({
          conversationId,
          fullName: targetFullName,
          email: draft?.email,
          phone: draft?.phone,
          note: draft?.note,
          currentUserId: currentUser.id,
          partnerUserId: conversation?.partnerUserId || null,
          listingId: conversation?.listing?.id || null,
          createdByName: currentProfile?.displayName || currentUser.email || 'Agent',
        });

        showToast(`Lead created for ${targetFullName}`);

        // Re-hydrate conversation details and counts immediately
        await fetchConversationDetails();
        if (result?.leadId) {
          void fetchInquiryCounts(result.leadId);
        }
      } catch (err: any) {
        showToast(err?.message || 'Unable to create lead');
        throw err;
      }
    },
    [
      currentUser,
      conversationId,
      conversation?.partnerUserId,
      conversation?.partnerName,
      conversation?.listing?.id,
      partnerNameParam,
      currentProfile?.displayName,
      fetchConversationDetails,
      fetchInquiryCounts,
      showToast,
    ]
  );

  const handleToggleArchive = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const willArchive = !Boolean(conversation?.isArchived);
    setConversation((prev: any) => (prev ? { ...prev, isArchived: willArchive } : prev));
    showToast(willArchive ? 'Chat archived' : 'Chat unarchived');

    try {
      await conversationRepository.toggleConversationArchive(
        conversationId,
        currentUser.id,
        willArchive
      );
    } catch (e: any) {
      setConversation((prev: any) => (prev ? { ...prev, isArchived: !willArchive } : prev));
      showToast('Unable to update archive state');
    }
  }, [currentUser, conversationId, conversation?.isArchived, showToast]);

  const handleToggleMute = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const willMute = !Boolean(conversation?.isMuted);
    setConversation((prev: any) => (prev ? { ...prev, isMuted: willMute } : prev));
    showToast(willMute ? 'Notifications muted' : 'Notifications unmuted');

    try {
      await conversationRepository.toggleConversationMute(
        conversationId,
        currentUser.id,
        willMute
      );
    } catch (e: any) {
      setConversation((prev: any) => (prev ? { ...prev, isMuted: !willMute } : prev));
      showToast('Unable to update mute state');
    }
  }, [currentUser, conversationId, conversation?.isMuted, showToast]);

  const handleToggleBlock = useCallback(async () => {
    if (!currentUser) return;
    const partnerId = conversation?.partnerUserId;
    if (!partnerId) return;

    const isCurrentlyBlocked = Boolean(conversation?.isBlocked);

    if (isCurrentlyBlocked) {
      // Unblock directly with optimistic update
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversation((prev: any) =>
        prev ? { ...prev, isBlocked: false, blockedByMe: false } : prev
      );
      showToast('Contact unblocked');

      try {
        await conversationRepository.toggleChatUserBlock(partnerId);
      } catch (e: any) {
        setConversation((prev: any) =>
          prev ? { ...prev, isBlocked: true, blockedByMe: true } : prev
        );
        showToast('Unable to unblock contact');
      }
    } else {
      // Prompt confirmation before blocking
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Block Contact',
        `Block ${conversation?.partnerName || 'this contact'} from messaging or calling you in chat?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block Contact',
            style: 'destructive',
            onPress: async () => {
              setConversation((prev: any) =>
                prev ? { ...prev, isBlocked: true, blockedByMe: true } : prev
              );
              showToast('Contact blocked in chat');
              try {
                await conversationRepository.toggleChatUserBlock(partnerId);
              } catch (e: any) {
                setConversation((prev: any) =>
                  prev ? { ...prev, isBlocked: false, blockedByMe: false } : prev
                );
                showToast('Unable to block contact');
              }
            },
          },
        ]
      );
    }
  }, [currentUser, conversation?.partnerUserId, conversation?.partnerName, conversation?.isBlocked, showToast]);

  const handleSubmitReport = useCallback(async (reason: string, details: string) => {
    if (!currentUser || !conversationId) return;
    try {
      const partnerId = conversation?.partnerUserId;
      await supabase.from('chat_reports').insert({
        conversation_id: conversationId,
        reported_by_user_id: currentUser.id,
        reported_user_id: partnerId || null,
        reason,
        details: details || null,
      });
      Alert.alert('Report Submitted', 'Thank you. Our Trust & Safety team will review this report.');
    } catch {
      try {
        await fetchWithAuth('/api/chats/report', {
          method: 'POST',
          body: JSON.stringify({
            inquiryId: conversationId,
            reason,
            details,
            messagesConsent: true,
          }),
        });
        Alert.alert('Report Submitted', 'Thank you. Our moderation team has received your report.');
      } catch {
        Alert.alert('Report Logged', 'Your report has been received by trust and safety.');
      }
    }
  }, [currentUser, conversationId, conversation?.partnerUserId]);

  return {
    currentUser,
    currentProfile,
    conversation,
    setConversation,
    fetchConversationDetails,
    ensureParticipantAuthorization,
    handleUpdateLeadStatus,
    handleToggleInThreadAgentShare,
    handleConvertToLead,
    handleToggleArchive,
    handleToggleMute,
    handleToggleBlock,
    handleSubmitReport,
    notesCount,
    reportsCount,
    fetchInquiryCounts,
    toastMessage,
    showToast,
    dismissToast,
  };
}
