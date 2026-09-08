import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile, canAssignAgents, canReceiveLeads, UserProfile } from '../../lib/auth';
import { resolveAvatarUrl, resolveListingImageUrl } from '../../lib/media-utils';
import { fetchWithAuth } from '../../lib/api-client';
import type { ChatConversation } from '../../components/chat/ConversationRow';
import { conversationRepository, leadsRepository } from '../../lib/repositories';
import type { MuteDuration } from '../../lib/repositories/conversationRepository';
import { OfflineEngine } from '../../lib/offline-engine';
import * as Haptics from '../../lib/haptics';

export interface UseThreadSessionParams {
  conversationId: string;
  partnerNameParam?: string;
  titleParam?: string;
  partnerSubtitleParam?: string;
  listingIdParam?: string;
}

export function useThreadSession({ conversationId, partnerNameParam, titleParam, partnerSubtitleParam, listingIdParam }: UseThreadSessionParams) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const currentUserRef = useRef<any>(currentUser);
  currentUserRef.current = currentUser;
  const currentProfileRef = useRef<UserProfile | null>(currentProfile);
  currentProfileRef.current = currentProfile;
  const [conversation, setConversation] = useState<ChatConversation | null>(() => {
    return OfflineEngine.getConversationSync(conversationId);
  });
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

  // 0. Storage fallback hydration if memory cache was empty
  useEffect(() => {
    if (!conversation && conversationId) {
      void OfflineEngine.getConversations().then((cachedList) => {
        const found = cachedList.find((c) => c.id === conversationId);
        if (found) {
          setConversation((prev) => prev || found);
        }
      });
    }
  }, [conversationId, conversation]);

  // 1. Fetch conversation details & partner info
  const fetchConversationDetails = useCallback(async (userOverride?: any) => {
    const activeUser = userOverride || currentUserRef.current;
    if (!conversationId || !activeUser) return;
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

      const isAuthorizedParticipant = (participants || []).some((p: any) => p.user_id === activeUser.id);
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

      const currentParticipant = (participants || []).find((p: any) => p.user_id === activeUser.id);
      const isViewerBuyer = currentParticipant?.participant_role === 'buyer' || (!convRow?.agency_user_id && convRow?.buyer_user_id === activeUser.id);

      // Resolve true conversational partner (Client / Buyer when viewed by Agency/Agent/Dev)
      let partnerUserId: string | null = null;
      if (!isViewerBuyer) {
        const targetBuyerId = convRow?.buyer_user_id || inquiryData?.buyer_user_id;
        if (targetBuyerId && targetBuyerId !== activeUser.id) {
          partnerUserId = targetBuyerId;
        } else {
          const buyerPart = (participants || []).find(
            (p: any) => p.participant_role === 'buyer' && p.user_id !== activeUser.id
          );
          if (buyerPart?.user_id) partnerUserId = buyerPart.user_id;
        }
      } else {
        const targetAgencyId = convRow?.agency_user_id || inquiryData?.agency_user_id || inquiryData?.company_user_id;
        if (targetAgencyId && targetAgencyId !== activeUser.id) {
          partnerUserId = targetAgencyId;
        }
      }

      if (!partnerUserId) {
        const otherParticipant = (participants || []).find((p: any) => p.user_id !== activeUser.id);
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

      let resolvedListing =
        convRow?.context_snapshot?.listing ||
        (convRow?.context_snapshot?.title ? convRow.context_snapshot : null);
      const effectiveListingId =
        listingIdParam ||
        convRow?.listing_id ||
        inquiryData?.listing_id ||
        convRow?.context_snapshot?.listing_id ||
        convRow?.context_snapshot?.id ||
        resolvedListing?.id;

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
            imageUrl: listingData.homepage_image_url || resolvedListing?.imageUrl,
            assigned_agent_user_id: listingData.assigned_agent_user_id || resolvedListing?.assigned_agent_user_id,
            address: listingData.address || resolvedListing?.address,
            city: listingData.city || resolvedListing?.city,
            state: listingData.state || resolvedListing?.state,
            listingType: listingData.listing_type || resolvedListing?.listingType,
            listingStatus: listingData.listing_status || resolvedListing?.listingStatus,
            referenceCode: listingData.reference_code || resolvedListing?.referenceCode,
          };
        }
      }

      // If resolvedListing still has no title, check if partnerSubtitleParam holds a listing title
      const isSubtitleGeneric =
        !partnerSubtitleParam ||
        partnerSubtitleParam === 'Direct Message' ||
        partnerSubtitleParam === 'Group Conversation' ||
        partnerSubtitleParam === 'DeltanHub Direct' ||
        partnerSubtitleParam.includes('participant') ||
        partnerSubtitleParam === 'Loading...';

      if (!resolvedListing?.title && !isSubtitleGeneric && effectiveListingId) {
        resolvedListing = {
          id: effectiveListingId,
          title: partnerSubtitleParam,
          imageUrl: null,
          address: undefined,
          city: undefined,
          state: undefined,
          listingType: undefined,
          listingStatus: undefined,
          referenceCode: undefined,
        };
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
      const profile = currentProfileRef.current || (await getCurrentProfile());
      const isViewerProfessional = canReceiveLeads(profile?.mainRole);

      // Can viewer manage assignments in this thread? (DeltanHub Web parity: chat-service.ts:L2862)
      const canAssignAgentsInThread =
        Boolean(convRow?.agency_user_id && convRow.agency_user_id === activeUser.id) ||
        Boolean(inquiryData?.company_user_id && inquiryData.company_user_id === activeUser.id);

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
            assignedByUserId: inquiryData.company_user_id || inquiryData.agency_user_id || (convRow as any)?.agency_user_id || activeUser.id,
            assignedAt: inquiryData.assigned_at || inquiryData.created_at || convRow?.updated_at || null,
            agencyUserId: inquiryData.agency_user_id || inquiryData.company_user_id || (convRow as any)?.agency_user_id || activeUser.id,
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
      if (partnerUserId && activeUser?.id) {
        try {
          const blockInfo = await conversationRepository.checkChatBlockedStatus(
            activeUser.id,
            partnerUserId
          );
          isBlocked = blockInfo.isBlocked;
          blockedByMe = blockInfo.blockedByMe;
        } catch {
          // non-critical
        }
      }

      const resolvedAgent = (inquiryData?.assigned_agent_user_id || effectiveAgentUserId)
        ? {
            userId: (inquiryData?.assigned_agent_user_id || effectiveAgentUserId) as string,
            fullName: assignedAgentName,
            avatarUrl: assignedAgentAvatar,
          }
        : null;

      const effectiveAgencyUserId = inquiryData?.company_user_id || inquiryData?.agency_user_id || (convRow as any)?.agency_user_id || null;
      let resolvedAgencyName: string | null = null;
      if (effectiveAgencyUserId) {
        const { data: agencyProfiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: [effectiveAgencyUserId],
        });
        if (agencyProfiles && agencyProfiles[0]) {
          resolvedAgencyName =
            agencyProfiles[0].display_name?.trim() ||
            agencyProfiles[0].full_name?.trim() ||
            null;
        }
      }

      const updatedConversation: ChatConversation = {
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
        inquiryId: inquiryData?.id || null,
        agencyName: resolvedAgencyName,
        assignedAgent: resolvedAgent,
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

      if (assignmentObj?.id) {
        void fetchInquiryCounts(assignmentObj.id);
      }
    } catch (err) {
      console.warn('Failed to load conversation details', err);
    }
  }, [conversationId, partnerNameParam, titleParam, partnerSubtitleParam, listingIdParam, fetchInquiryCounts]);

  // 2. Initialize user, current profile, and fetch conversation
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!isMounted) return;
      if (!user) {
        router.replace('/auth');
        return;
      }
      currentUserRef.current = user;
      setCurrentUser(user);
      const prof = await getCurrentProfile();
      if (!isMounted) return;
      currentProfileRef.current = prof;
      setCurrentProfile(prof);
      void fetchConversationDetails(user);
    });
    return () => {
      isMounted = false;
    };
  }, [conversationId, fetchConversationDetails]);

  // Authorization check before dispatching messages
  const ensureParticipantAuthorization = useCallback(async (): Promise<boolean> => {
    const activeUser = currentUserRef.current;
    if (!activeUser || !conversationId) return false;
    try {
      const { data: partRow, error } = await supabase
        .from('chat_participants')
        .select('id, can_send, removed_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', activeUser.id)
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
  }, [conversationId]);

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

  // In-thread agent share toggle with confirmation guard
  const handleToggleInThreadAgentShare = useCallback(async () => {
    const assignment = conversation?.assignment;
    const leadId = assignment?.leadId;
    if (!assignment || !leadId) return;

    const currentlyEnabled = Boolean(assignment.agentShareEnabled);
    const nextEnabled = !currentlyEnabled;
    const agencyName = conversation?.agencyName || assignment.agencyName || 'Agency';

    const executeToggle = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Optimistic UI update
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
      showToast(nextEnabled ? `Thread shared with ${agencyName}` : 'Thread marked as private');

      try {
        const { error } = await supabase
          .from('crm_inquiries')
          .update({
            agent_share_enabled: nextEnabled,
            agent_share_enabled_at: nextEnabled ? new Date().toISOString() : null,
          })
          .eq('id', leadId);

        if (error) throw error;
      } catch (err: any) {
        // Revert optimistic UI update upon failure
        setConversation((prev: any) =>
          prev
            ? {
                ...prev,
                assignment: {
                  ...prev.assignment,
                  agentShareEnabled: currentlyEnabled,
                },
              }
            : null
        );
        Alert.alert('Share Toggle Error', err.message || 'Failed to update sharing setting');
      }
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!currentlyEnabled) {
      // Prompt confirmation before sharing with agency
      Alert.alert(
        `Share Thread with ${agencyName}?`,
        `Are you sure you want to share this conversation with ${agencyName} management? Principal brokers will be able to review messages in this thread.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share with Agency',
            onPress: executeToggle,
          },
        ]
      );
    } else {
      // Prompt confirmation before making thread private
      Alert.alert(
        'Make Thread Private?',
        `Are you sure you want to revoke ${agencyName} access? Only you and the client will be able to view future messages in this thread.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Make Private',
            style: 'destructive',
            onPress: executeToggle,
          },
        ]
      );
    }
  }, [conversation?.assignment, conversation?.agencyName, showToast]);

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

  // ── Time-Based Mute Modal State ──
  const [isMuteModalVisible, setIsMuteModalVisible] = useState(false);
  const openMuteModal = useCallback(() => setIsMuteModalVisible(true), []);
  const closeMuteModal = useCallback(() => setIsMuteModalVisible(false), []);

  const handleMuteWithDuration = useCallback(async (duration: MuteDuration) => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuteModalVisible(false);

    if (duration === 'unmute') {
      // Unmute
      setConversation((prev: any) => (prev ? { ...prev, isMuted: false } : prev));
      showToast('Notifications unmuted');
      try {
        await conversationRepository.toggleConversationMute(conversationId, currentUser.id, false);
      } catch {
        setConversation((prev: any) => (prev ? { ...prev, isMuted: true } : prev));
        showToast('Unable to update mute state');
      }
    } else {
      // Mute with duration
      setConversation((prev: any) => (prev ? { ...prev, isMuted: true } : prev));
      const toastMap: Record<string, string> = {
        '8h': 'Notifications muted for 8 hours',
        '1w': 'Notifications muted for 1 week',
        'always': 'Notifications muted',
      };
      showToast(toastMap[duration] || 'Notifications muted');
      try {
        await conversationRepository.toggleConversationMute(conversationId, currentUser.id, true, duration);
      } catch {
        setConversation((prev: any) => (prev ? { ...prev, isMuted: false } : prev));
        showToast('Unable to update mute state');
      }
    }
  }, [currentUser, conversationId, showToast]);

  const handleToggleMute = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Boolean(conversation?.isMuted)) {
      // Currently muted → immediately unmute
      handleMuteWithDuration('unmute');
    } else {
      // Currently unmuted → open duration picker
      openMuteModal();
    }
  }, [currentUser, conversationId, conversation?.isMuted, handleMuteWithDuration, openMuteModal]);

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

  const handleSubmitReport = useCallback(
    async (reason: string, details: string, messagesConsent: boolean = false) => {
      if (!currentUser || !conversationId) return;

      const effectiveInquiryId =
        conversation?.inquiryId || conversation?.assignment?.inquiryId || conversation?.assignment?.id || null;
      const agencyName = conversation?.agencyName || conversation?.assignment?.agencyName || 'supervising management';

      // 1. If an inquiry exists, submit directly to master_lead_reports matching DeltanHub architecture
      if (effectiveInquiryId) {
        try {
          const { error } = await supabase.from('master_lead_reports').insert({
            inquiry_id: effectiveInquiryId,
            reporter_user_id: currentUser.id,
            reason: reason.trim(),
            details: details?.trim() || null,
            messages_consent: messagesConsent,
            messages_consent_at: messagesConsent ? new Date().toISOString() : null,
            report_status: 'pending',
          });

          if (error) throw error;

          // Re-sync reports count badge for supervising management
          void fetchInquiryCounts(effectiveInquiryId);

          Alert.alert(
            'Report Submitted',
            messagesConsent
              ? `Your report has been submitted to ${agencyName}. You have authorized management to review chat messages in this thread to investigate your complaint.`
              : `Your report has been submitted to ${agencyName}. Chat messages remain private as requested.`
          );
          return;
        } catch {
          // Fallback to API endpoint if direct insert failed
          try {
            await fetchWithAuth('/api/chats/report', {
              method: 'POST',
              body: JSON.stringify({
                inquiryId: effectiveInquiryId,
                reason: reason.trim(),
                details: details?.trim() || null,
                messagesConsent,
              }),
            });
            void fetchInquiryCounts(effectiveInquiryId);
            Alert.alert(
              'Report Submitted',
              messagesConsent
                ? `Your report has been submitted to ${agencyName}. Management may review messages to investigate.`
                : `Your report has been submitted to ${agencyName}. Chat messages remain private.`
            );
            return;
          } catch {
            // Non-blocking fallback to platform reports
          }
        }
      }

      // 2. Platform trust and safety report fallback
      try {
        const partnerId = conversation?.partnerUserId;
        await supabase.from('chat_reports').insert({
          conversation_id: conversationId,
          reported_by_user_id: currentUser.id,
          reported_user_id: partnerId || null,
          reason: reason.trim(),
          details: details?.trim() || null,
        });
        Alert.alert('Report Submitted', 'Thank you. Our Trust & Safety team will review this report.');
      } catch {
        Alert.alert('Report Logged', 'Your report has been received by trust and safety.');
      }
    },
    [currentUser, conversationId, conversation?.inquiryId, conversation?.assignment, conversation?.agencyName, conversation?.partnerUserId, fetchInquiryCounts]
  );

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
    isMuteModalVisible,
    openMuteModal,
    closeMuteModal,
    handleMuteWithDuration,
    handleToggleBlock,
    handleSubmitReport,
    notesCount,
    reportsCount,
    fetchInquiryCounts,
    canReportAgent: Boolean(
      conversation?.assignedAgent ||
      conversation?.assignment?.assignedAgentUserId ||
      conversation?.inquiryId
    ),
    toastMessage,
    showToast,
    dismissToast,
  };
}
