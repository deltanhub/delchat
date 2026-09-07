import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile, canAssignAgents, UserProfile } from '../../lib/auth';
import { resolveAvatarUrl, resolveListingImageUrl } from '../../lib/media-utils';
import { fetchWithAuth } from '../../lib/api-client';
import type { ChatConversation } from '../../components/chat/ConversationRow';
import * as Haptics from '../../lib/haptics';

export interface UseThreadSessionParams {
  conversationId: string;
  partnerNameParam?: string;
  titleParam?: string;
}

export function useThreadSession({ conversationId, partnerNameParam, titleParam }: UseThreadSessionParams) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);

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
          listing_id, context_snapshot, last_message_preview, last_message_at
        `)
        .eq('id', conversationId)
        .maybeSingle();

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, participant_role, last_read_at, removed_at')
        .eq('conversation_id', conversationId)
        .is('removed_at', null);

      const isAuthorizedParticipant = (participants || []).some((p: any) => p.user_id === currentUser.id);
      if (!isAuthorizedParticipant) {
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        router.replace('/(tabs)');
        return;
      }

      const partnerParticipant = (participants || []).find((p: any) => p.user_id !== currentUser.id);
      let partnerName = partnerNameParam || 'Member';
      let partnerAvatarUrl: string | null = null;
      let partnerUserId = partnerParticipant?.user_id || null;
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
      if (!resolvedListing?.title && convRow?.listing_id) {
        const { data: listingData } = await supabase
          .from('listing_submissions')
          .select('id, title, homepage_image_url')
          .eq('id', convRow.listing_id)
          .maybeSingle();
        if (listingData) {
          resolvedListing = {
            id: listingData.id,
            title: listingData.title,
            imageUrl: listingData.homepage_image_url,
          };
        }
      }

      const listingObj = resolvedListing
        ? {
            id: resolvedListing.id || convRow?.listing_id,
            title: resolvedListing.title,
            imageUrl: resolveListingImageUrl(
              resolvedListing.imageUrl ||
              resolvedListing.homepage_image_url ||
              resolvedListing.cover_image_url
            ),
          }
        : null;

      const isGroup = (participants && participants.length > 2) || convRow?.conversation_kind === 'group';
      const participantCount = participants ? participants.length : 2;

      // 2b. Fetch CRM Inquiry / Lead Assignment
      const { data: inquiryData } = await supabase
        .from('crm_inquiries')
        .select(`
          id, inquiry_status, master_lead_status,
          assigned_agent_user_id, agency_user_id, company_user_id,
          agent_share_enabled, handoff_note
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let assignedAgentName = 'Assigned Agent';
      let assignedAgentAvatar: string | null = null;

      if (inquiryData?.assigned_agent_user_id) {
        const { data: agentProfiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: [inquiryData.assigned_agent_user_id],
        });
        if (agentProfiles && agentProfiles[0]) {
          assignedAgentName =
            agentProfiles[0].display_name?.trim() ||
            agentProfiles[0].full_name?.trim() ||
            'Assigned Agent';
          assignedAgentAvatar = resolveAvatarUrl(agentProfiles[0].avatar_url);
        }
      }

      const assignmentObj = inquiryData
        ? {
            leadId: inquiryData.id,
            status: inquiryData.master_lead_status || inquiryData.inquiry_status || 'new',
            assignedAgentUserId: inquiryData.assigned_agent_user_id,
            assignedAgentName,
            assignedAgentAvatar,
            agencyUserId: inquiryData.agency_user_id || inquiryData.company_user_id,
            agentShareEnabled: Boolean(inquiryData.agent_share_enabled),
            handoffNote: inquiryData.handoff_note,
          }
        : null;

      setConversation({
        id: conversationId,
        conversationKind: (convRow?.conversation_kind as ChatConversation['conversationKind']) || 'direct',
        title: titleParam || partnerName,
        preview: convRow?.last_message_preview || '',
        updatedAt: convRow?.updated_at || null,
        unreadCount: 0,
        latestIntent: 'general',
        partnerName: partnerName,
        partnerSubtitle: listingObj?.title || (isGroup ? `${participantCount} participants` : 'Direct Message'),
        partnerAvatarUrl: partnerAvatarUrl,
        partnerUserId: partnerUserId,
        partnerLastSeenAt: partnerLastSeenAt,
        isGroup,
        participantCount,
        listing: listingObj ? {
          id: listingObj.id,
          title: listingObj.title,
          imageUrl: listingObj.imageUrl,
        } : null,
        assignment: assignmentObj,
        canAssignAgents: canAssignAgents(currentProfile?.mainRole),
      });
    } catch (err) {
      console.warn('Failed to load conversation details', err);
    }
  }, [conversationId, currentUser, currentProfile?.mainRole, partnerNameParam, titleParam]);

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
  const handleConvertToLead = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await supabase.from('crm_inquiries').insert({
        conversation_id: conversationId,
        buyer_user_id: conversation?.partnerUserId || currentUser.id,
        agency_user_id: currentUser.id,
        company_user_id: currentUser.id,
        lead_name: conversation?.partnerName || partnerNameParam || 'Client Lead',
        inquiry_status: 'active',
        master_lead_status: 'new',
      });
      Alert.alert('Lead Created', 'This conversation has been added to your CRM pipeline.');
    } catch (e: any) {
      Alert.alert('CRM Lead', 'Conversation registered with your CRM pipeline.');
    }
  }, [currentUser, conversationId, conversation?.partnerUserId, conversation?.partnerName, partnerNameParam]);

  const handleToggleArchive = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isArchived = Boolean(conversation?.isArchived);
      await supabase
        .from('chat_participants')
        .update({ archived_at: isArchived ? null : new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
      Alert.alert('Archive', isArchived ? 'Conversation unarchived' : 'Conversation moved to archive');
      setConversation((prev: any) => prev ? { ...prev, isArchived: !isArchived } : prev);
    } catch (e: any) {
      Alert.alert('Archive Error', e.message);
    }
  }, [currentUser, conversationId, conversation?.isArchived]);

  const handleToggleMute = useCallback(async () => {
    if (!currentUser || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isMuted = Boolean(conversation?.isMuted);
      const muteUntil = isMuted ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('chat_participants')
        .update({ muted_until: muteUntil })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
      Alert.alert('Mute', isMuted ? 'Notifications unmuted' : 'Notifications muted for 1 year');
      setConversation((prev: any) => prev ? { ...prev, isMuted: !isMuted } : prev);
    } catch (e: any) {
      Alert.alert('Mute Error', e.message);
    }
  }, [currentUser, conversationId, conversation?.isMuted]);

  const handleToggleBlock = useCallback(async () => {
    if (!currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const partnerId = conversation?.partnerUserId;
    Alert.alert(
      'Block User',
      `Block ${conversation?.partnerName || 'this user'} from messaging or calling you?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: async () => {
            try {
              if (partnerId) {
                await supabase.from('user_blocks').insert({
                  blocker_user_id: currentUser.id,
                  blocked_user_id: partnerId,
                });
              }
              Alert.alert('User Blocked', 'This user has been blocked.');
              router.back();
            } catch (e: any) {
              Alert.alert('Block Error', e.message);
            }
          },
        },
      ]
    );
  }, [currentUser, conversation?.partnerUserId, conversation?.partnerName, router]);

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
  };
}
