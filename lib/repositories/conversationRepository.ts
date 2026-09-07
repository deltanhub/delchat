import { supabase } from '../supabase';
import { resolveAvatarUrl, resolveListingImageUrl } from '../media-utils';
import { canAssignAgents, isAgent, AppProfile } from '../auth';
import type { ChatConversation } from '../../components/chat/ConversationRow';

export interface FetchInboxOptions {
  maxMsgLimit?: number;
}

/**
 * Domain Repository for Conversation data access.
 * Decouples presentation screens from raw database queries.
 */
export const conversationRepository = {
  /**
   * Fetches and stitches the complete Inbox conversations for an authenticated user.
   */
  async fetchInboxConversations(
    currentUserId: string,
    currentProfile: AppProfile | null,
    options?: FetchInboxOptions
  ): Promise<ChatConversation[]> {
    // 1. Get participant rows for currentUser
    const { data: participations, error: partErr } = await supabase
      .from('chat_participants')
      .select('conversation_id, participant_role, last_read_at, archived_at, muted_until, pinned_at')
      .eq('user_id', currentUserId)
      .is('removed_at', null);

    if (partErr) throw partErr;

    const convIds = (participations || []).map((p) => p.conversation_id);
    if (convIds.length === 0) {
      return [];
    }

    // 2. Query conversations with context_snapshot
    const { data: convRows, error: convErr } = await supabase
      .from('chat_conversations')
      .select(`
        id, conversation_kind, updated_at,
        listing_id, context_snapshot, last_message_preview, last_message_at
      `)
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (convErr) throw convErr;

    // Extract listing IDs for any conversation missing snapshot listing metadata
    const missingListingIds: string[] = [];
    convRows?.forEach((c: any) => {
      if (c.listing_id && !c.context_snapshot?.listing?.title) {
        missingListingIds.push(c.listing_id);
      }
    });

    const listingSubmissionsMap = new Map<string, any>();
    if (missingListingIds.length > 0) {
      const { data: listingRows } = await supabase
        .from('listing_submissions')
        .select('id, title, homepage_image_url')
        .in('id', missingListingIds);
      listingRows?.forEach((l: any) => listingSubmissionsMap.set(l.id, l));
    }

    // 3. Query crm_inquiries for these conversations
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
    inquiryRows?.forEach((inq: any) => {
      if (inq.conversation_id) {
        inquiryMap.set(inq.conversation_id, inq);
      }
    });

    // 4. Query participants of these conversations to find partner
    const { data: allParticipants } = await supabase
      .from('chat_participants')
      .select('conversation_id, user_id, participant_role')
      .in('conversation_id', convIds);

    const partnerUserIds = Array.from(
      new Set(
        (allParticipants || [])
          .filter((p) => p.user_id !== currentUserId)
          .map((p) => p.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    // Collect partner IDs and assigned agent IDs
    const userIdsToResolve = new Set<string>(partnerUserIds);
    inquiryRows?.forEach((inq: any) => {
      if (inq.assigned_agent_user_id) {
        userIdsToResolve.add(inq.assigned_agent_user_id);
      }
    });

    // 5. Resolve user profiles
    const profileMap = new Map<string, any>();
    if (userIdsToResolve.size > 0) {
      const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
        requested_user_ids: Array.from(userIdsToResolve),
      });
      profiles?.forEach((p: any) => {
        profileMap.set(p.user_id, p);
      });
    }

    // 6. Query last message and unread count per conversation (bounded to prevent mobile OOM)
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
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg);
      }
      const part = partMap.get(msg.conversation_id);
      const lastReadTime = part?.last_read_at ? new Date(part.last_read_at).getTime() : 0;
      const msgTime = new Date(msg.created_at).getTime();

      if (msg.sender_user_id !== currentUserId && msgTime > lastReadTime) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
      }
    });

    // 7. Map to ChatConversation with full assignment details
    const isViewerAgencyOrDev = canAssignAgents(currentProfile?.mainRole);

    const mapped: ChatConversation[] = (convRows || []).map((c: any) => {
      const part = partMap.get(c.id);
      const partnerPart = (allParticipants || []).find(
        (p) => p.conversation_id === c.id && p.user_id !== currentUserId
      );
      const partnerProfile = partnerPart?.user_id ? profileMap.get(partnerPart.user_id) : null;

      const snapshotListing = c.context_snapshot?.listing;
      const fallbackListing = c.listing_id ? listingSubmissionsMap.get(c.listing_id) : null;
      const resolvedListing = snapshotListing || fallbackListing;

      const listingObj = resolvedListing
        ? {
            id: resolvedListing.id || c.listing_id,
            title: resolvedListing.title,
            imageUrl: resolveListingImageUrl(
              resolvedListing.imageUrl ||
              resolvedListing.homepage_image_url ||
              resolvedListing.cover_image_url
            ),
          }
        : null;

      const partnerName =
        partnerProfile?.display_name?.trim() ||
        partnerProfile?.full_name?.trim() ||
        listingObj?.title ||
        (c.conversation_kind === 'group' ? 'Group Chat' : 'DeltanHub Member');

      const partnerAvatarUrl = partnerProfile?.avatar_url
        ? resolveAvatarUrl(partnerProfile.avatar_url)
        : null;

      const lastMsg = lastMsgMap.get(c.id);
      const preview =
        lastMsg?.message_kind === 'voice_note'
          ? '🎤 Voice note'
          : lastMsg?.message_kind === 'attachments'
          ? '📎 Attachment'
          : lastMsg?.message_kind === 'listing_card'
          ? '🏡 Property Card'
          : lastMsg?.message_kind === 'inquiry_form'
          ? '📋 Inquiry Form'
          : lastMsg?.body || c.last_message_preview || 'No messages yet';

      const unreadCount = unreadMap.get(c.id) || 0;
      const isMuted = part?.muted_until ? new Date(part.muted_until) > new Date() : false;
      const isPinned = Boolean(part?.pinned_at);
      const isArchived = Boolean(part?.archived_at);

      // Lead Assignment context
      const inq = inquiryMap.get(c.id);
      let assignedAgentName = 'Assigned Agent';
      let assignedAgentAvatar: string | null = null;
      if (inq?.assigned_agent_user_id) {
        const agentProfile = profileMap.get(inq.assigned_agent_user_id);
        if (agentProfile) {
          assignedAgentName =
            agentProfile.display_name?.trim() ||
            agentProfile.full_name?.trim() ||
            'Assigned Agent';
          assignedAgentAvatar = resolveAvatarUrl(agentProfile.avatar_url);
        }
      }

      const assignmentObj = inq
        ? {
            leadId: inq.id,
            status: inq.master_lead_status || inq.inquiry_status || 'new',
            assignedAgentUserId: inq.assigned_agent_user_id,
            assignedAgentName,
            assignedAgentAvatar,
            agencyUserId: inq.agency_user_id || inq.company_user_id,
            agentShareEnabled: Boolean(inq.agent_share_enabled),
            handoffNote: inq.handoff_note,
          }
        : null;

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
        partnerUserId: partnerPart?.user_id || null,
        partnerLastSeenAt: partnerProfile?.last_seen_at || null,
        isGroup,
        participantCount: 2,
        isMuted,
        isPinned,
        isArchived,
        pinnedAt: part?.pinned_at || null,
        listing: listingObj,
        assignment: assignmentObj,
        canAssignAgents: isViewerAgencyOrDev,
      };
    });

    return mapped;
  },

  /**
   * Mark all unread messages in a conversation as read.
   */
  async markConversationRead(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_chat_conversation_read_atomic', {
      p_conversation_id: conversationId,
    });
    if (error) throw error;
  },

  /**
   * Toggle pinned state for a conversation.
   */
  async toggleConversationPinned(conversationId: string, willPin: boolean): Promise<void> {
    const { error } = await supabase.rpc('toggle_chat_conversation_pinned_atomic', {
      p_conversation_id: conversationId,
      p_pinned: willPin,
    });
    if (error) throw error;
  },

  /**
   * Toggle muted state for a conversation.
   */
  async toggleConversationMute(
    conversationId: string,
    currentUserId: string,
    willMute: boolean
  ): Promise<void> {
    const muteUntil = willMute
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('chat_participants')
      .update({ muted_until: muteUntil })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);

    if (error) throw error;
  },

  /**
   * Mute or unmute notifications for a conversation (duration-based).
   */
  async muteConversation(
    conversationId: string,
    currentUserId: string,
    durationHours: number
  ): Promise<void> {
    const mutedUntil =
      durationHours === 0
        ? null
        : new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

    const { error } = await supabase
      .from('chat_participants')
      .update({ muted_until: mutedUntil })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);

    if (error) throw error;
  },

  /**
   * Toggle archive state for a conversation.
   */
  async toggleConversationArchive(
    conversationId: string,
    currentUserId: string,
    willArchive: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('chat_participants')
      .update({ archived_at: willArchive ? new Date().toISOString() : null })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);

    if (error) throw error;
  },

  /**
   * Archive or unarchive a conversation.
   */
  async archiveConversation(
    conversationId: string,
    currentUserId: string,
    archive: boolean
  ): Promise<void> {
    return this.toggleConversationArchive(conversationId, currentUserId, archive);
  },

  /**
   * Mark a conversation as unread.
   */
  async markConversationUnread(conversationId: string, currentUserId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_participants')
      .update({ last_read_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);

    if (error) throw error;
  },
};
