import { supabase } from '../supabase';
import { resolveAvatarUrl, resolveListingImageUrl } from '../media-utils';
import { canAssignAgents, canReceiveLeads, isAgent, AppProfile } from '../auth';
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
      .select('conversation_id, participant_role, last_read_at, archived_at, muted_until, pinned_at, favorited_at, cleared_history_at')
      .eq('user_id', currentUserId)
      .is('removed_at', null);

    if (partErr) throw partErr;

    const convIds = (participations || []).map((p) => p.conversation_id);
    if (convIds.length === 0) {
      return [];
    }

    // 2. Query conversations with context_snapshot and ownership
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

    // Extract listing IDs from conversations and CRM inquiries to fetch metadata
    const allListingIds: string[] = [];
    convRows?.forEach((c: any) => {
      if (c.listing_id) {
        allListingIds.push(c.listing_id);
      }
    });
    inquiryRows?.forEach((inq: any) => {
      if (inq.listing_id) {
        allListingIds.push(inq.listing_id);
      }
    });

    const listingSubmissionsMap = new Map<string, any>();
    if (allListingIds.length > 0) {
      const { data: listingRows } = await supabase
        .from('listing_submissions')
        .select('id, title, homepage_image_url, assigned_agent_user_id, address, city, state, listing_type, listing_status, reference_code')
        .in('id', Array.from(new Set(allListingIds)));
      listingRows?.forEach((l: any) => listingSubmissionsMap.set(l.id, l));
    }

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

    // Collect partner IDs, buyer IDs, agency IDs and assigned agent IDs
    const userIdsToResolve = new Set<string>(partnerUserIds);
    inquiryRows?.forEach((inq: any) => {
      if (inq.buyer_user_id) userIdsToResolve.add(inq.buyer_user_id);
      if (inq.agency_user_id) userIdsToResolve.add(inq.agency_user_id);
      if (inq.company_user_id) userIdsToResolve.add(inq.company_user_id);
      if (inq.assigned_agent_user_id) userIdsToResolve.add(inq.assigned_agent_user_id);
    });
    listingSubmissionsMap.forEach((l: any) => {
      if (l.assigned_agent_user_id) {
        userIdsToResolve.add(l.assigned_agent_user_id);
      }
    });
    convRows?.forEach((c: any) => {
      if (c.buyer_user_id) userIdsToResolve.add(c.buyer_user_id);
      if (c.agency_user_id) userIdsToResolve.add(c.agency_user_id);
      if (c.recipient_user_id) userIdsToResolve.add(c.recipient_user_id);
      const snapAgentId = c.context_snapshot?.listing?.assigned_agent_user_id;
      if (snapAgentId) {
        userIdsToResolve.add(snapAgentId);
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
      const part = partMap.get(msg.conversation_id);
      if (part?.cleared_history_at && msg.created_at <= part.cleared_history_at) {
        return;
      }
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg);
      }
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
      const inq = inquiryMap.get(c.id);

      // Determine if viewer is the client/buyer in this conversation
      const currentParticipantRole = part?.participant_role;
      const isViewerBuyer = currentParticipantRole === 'buyer' || (!c.agency_user_id && c.buyer_user_id === currentUserId);

      // Can viewer manage assignments in this thread? (DeltanHub Web parity: chat-service.ts:L2862)
      const canAssignAgentsInThread =
        Boolean(c.agency_user_id && c.agency_user_id === currentUserId) ||
        Boolean(inq?.company_user_id && inq.company_user_id === currentUserId);

      // Resolve conversational partner (Buyer/Client when viewed by Agency/Agent/Dev)
      let partnerUserId: string | null = null;
      if (!isViewerBuyer) {
        // When viewed by Agency/Developer/Agent, the conversation partner is the client/buyer
        const targetBuyerId = c.buyer_user_id || inq?.buyer_user_id;
        if (targetBuyerId && targetBuyerId !== currentUserId) {
          partnerUserId = targetBuyerId;
        } else {
          const buyerPart = (allParticipants || []).find(
            (p) => p.conversation_id === c.id && p.participant_role === 'buyer' && p.user_id !== currentUserId
          );
          if (buyerPart?.user_id) {
            partnerUserId = buyerPart.user_id;
          }
        }
      } else {
        // When viewed by Buyer, the partner is the Agency / Publisher
        const targetAgencyId = c.agency_user_id || inq?.agency_user_id || inq?.company_user_id;
        if (targetAgencyId && targetAgencyId !== currentUserId) {
          partnerUserId = targetAgencyId;
        }
      }

      // Fallback: any other non-self participant
      if (!partnerUserId) {
        const otherPart = (allParticipants || []).find(
          (p) => p.conversation_id === c.id && p.user_id !== currentUserId
        );
        partnerUserId = otherPart?.user_id || null;
      }

      const partnerProfile = partnerUserId ? profileMap.get(partnerUserId) : null;

      const snapshotListing = c.context_snapshot?.listing;
      const fallbackListing =
        (c.listing_id ? listingSubmissionsMap.get(c.listing_id) : null) ||
        (inq?.listing_id ? listingSubmissionsMap.get(inq.listing_id) : null);
      const resolvedListing = snapshotListing || fallbackListing;

      const listingObj = resolvedListing
        ? {
            id: resolvedListing.id || c.listing_id || inq?.listing_id,
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

      const partnerName =
        partnerProfile?.display_name?.trim() ||
        partnerProfile?.full_name?.trim() ||
        listingObj?.title ||
        (c.conversation_kind === 'group' ? 'Group Chat' : 'DeltanHub Member');

      const partnerAvatarUrl = partnerProfile?.avatar_url
        ? resolveAvatarUrl(partnerProfile.avatar_url)
        : null;

      const isHistoryCleared = Boolean(part?.cleared_history_at && c.last_message_at && c.last_message_at <= part.cleared_history_at);
      const lastMsg = lastMsgMap.get(c.id);
      const preview = isHistoryCleared
        ? 'No messages yet'
        : lastMsg?.message_kind === 'voice_note'
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
      const listingAssignedAgentId =
        resolvedListing?.assigned_agent_user_id ||
        c.context_snapshot?.listing?.assigned_agent_user_id ||
        null;

      const effectiveAgentUserId =
        inq?.assigned_agent_user_id || listingAssignedAgentId || null;

      let assignedAgentName: string | null = null;
      let assignedAgentAvatar: string | null = null;
      if (effectiveAgentUserId) {
        const agentProfile = profileMap.get(effectiveAgentUserId);
        if (agentProfile) {
          assignedAgentName =
            agentProfile.display_name?.trim() ||
            agentProfile.full_name?.trim() ||
            'Assigned Agent';
          assignedAgentAvatar = resolveAvatarUrl(agentProfile.avatar_url);
        }
      }

      // Professional role check for lead assignment access
      const isViewerProfessional = canReceiveLeads(currentProfile?.mainRole);

      // In DeltanHub Web, an assignment object is only returned when an agent is actually assigned
      const hasAssignedAgent = Boolean(inq?.assigned_agent_user_id || effectiveAgentUserId);

      const assignmentObj = (inq && isViewerProfessional && hasAssignedAgent)
        ? {
            id: inq.id,
            inquiryId: inq.id,
            leadId: inq.id,
            status: inq.master_lead_status || inq.inquiry_status || 'new',
            masterLeadStatus: inq.master_lead_status || inq.inquiry_status || 'new',
            assignedAgentUserId: inq.assigned_agent_user_id || effectiveAgentUserId,
            assignedAgentName: (inq.assigned_agent_user_id || effectiveAgentUserId) ? (assignedAgentName || 'Assigned Agent') : null,
            assignedAgentAvatar: (inq.assigned_agent_user_id || effectiveAgentUserId) ? assignedAgentAvatar : null,
            assignedByUserId: inq.company_user_id || inq.agency_user_id || c.agency_user_id || null,
            assignedAt: inq.assigned_at || inq.created_at || c.updated_at || null,
            agencyUserId: inq.agency_user_id || inq.company_user_id || c.agency_user_id || null,
            agentShareEnabled: Boolean(inq.agent_share_enabled),
            handoffNote: inq.handoff_note || null,
            agent: inq.assigned_agent_user_id
              ? {
                  userId: inq.assigned_agent_user_id,
                  fullName: assignedAgentName || 'Assigned Agent',
                  avatarUrl: assignedAgentAvatar,
                }
              : effectiveAgentUserId
              ? {
                  userId: effectiveAgentUserId,
                  fullName: assignedAgentName || 'Assigned Agent',
                  avatarUrl: assignedAgentAvatar,
                }
              : null,
          }
        : (isViewerProfessional && effectiveAgentUserId)
        ? {
            id: `listing_inq_${c.id}`,
            inquiryId: `listing_inq_${c.id}`,
            leadId: `listing_inq_${c.id}`,
            status: 'new',
            masterLeadStatus: 'new',
            assignedAgentUserId: effectiveAgentUserId,
            assignedAgentName: effectiveAgentUserId ? (assignedAgentName || 'Assigned Agent') : null,
            assignedAgentAvatar: effectiveAgentUserId ? assignedAgentAvatar : null,
            assignedByUserId: c.agency_user_id || null,
            assignedAt: c.updated_at || null,
            agencyUserId: c.agency_user_id || null,
            agentShareEnabled: false,
            handoffNote: null,
            agent: effectiveAgentUserId
              ? {
                  userId: effectiveAgentUserId,
                  fullName: assignedAgentName || 'Assigned Agent',
                  avatarUrl: assignedAgentAvatar,
                }
              : null,
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
        partnerUserId: partnerUserId || null,
        partnerLastSeenAt: partnerProfile?.last_seen_at || null,
        isGroup,
        participantCount: 2,
        isMuted,
        isPinned,
        isArchived,
        pinnedAt: part?.pinned_at || null,
        isFavorited: Boolean(part?.favorited_at),
        favoritedAt: part?.favorited_at || null,
        clearedHistoryAt: part?.cleared_history_at || null,
        listing: listingObj,
        assignment: assignmentObj,
        canAssignAgents: canAssignAgentsInThread,
      };
    });

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
   * Mark unread messages in a conversation as delivered atomically via RPC.
   * Updates delivered_at and message_status to 'delivered' so sender sees double grey checkmarks.
   */
  async markConversationDelivered(
    conversationId: string,
    messageIds?: string[] | null
  ): Promise<{ success: boolean; messagesDelivered: number }> {
    try {
      const { data, error } = await supabase.rpc('mark_chat_conversation_delivered_atomic', {
        p_conversation_id: conversationId,
        p_message_ids: messageIds && messageIds.length > 0 ? messageIds : null,
      });
      if (error) {
        console.warn('[conversationRepository] markConversationDelivered error:', error.message);
        return { success: false, messagesDelivered: 0 };
      }
      return {
        success: Boolean(data?.success),
        messagesDelivered: Number(data?.messages_delivered || 0),
      };
    } catch (err: any) {
      console.warn('[conversationRepository] markConversationDelivered catch:', err?.message);
      return { success: false, messagesDelivered: 0 };
    }
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

  /**
   * Toggle block/unblock for a user in chat.
   * Calls the atomic SECURITY DEFINER RPC toggle_chat_user_block.
   */
  async toggleChatUserBlock(targetUserId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('toggle_chat_user_block', {
      p_target_user_id: targetUserId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  /**
   * Checks bidirectional chat block status between current user and target user.
   */
  async checkChatBlockedStatus(
    currentUserId: string,
    targetUserId: string
  ): Promise<{ isBlocked: boolean; blockedByMe: boolean; hasBlockedMe: boolean }> {
    const { data, error } = await supabase
      .from('chat_blocked_users')
      .select('blocker_user_id, blocked_user_id')
      .or(`blocker_user_id.eq.${currentUserId},blocked_user_id.eq.${currentUserId}`);

    if (error || !data) {
      return { isBlocked: false, blockedByMe: false, hasBlockedMe: false };
    }

    const blockedByMe = data.some(
      (b: any) => b.blocker_user_id === currentUserId && b.blocked_user_id === targetUserId
    );
    const hasBlockedMe = data.some(
      (b: any) => b.blocker_user_id === targetUserId && b.blocked_user_id === currentUserId
    );

    return {
      isBlocked: blockedByMe || hasBlockedMe,
      blockedByMe,
      hasBlockedMe,
    };
  },

  /**
   * Toggle favorited state for a conversation atomically via RPC.
   */
  async toggleConversationFavorite(
    conversationId: string,
    willFavorite?: boolean
  ): Promise<{ success: boolean; isFavorited: boolean; favoritedAt: string | null }> {
    const { data, error } = await supabase.rpc('toggle_chat_conversation_favorite_atomic', {
      p_conversation_id: conversationId,
      p_favorited: willFavorite !== undefined ? willFavorite : null,
    });
    if (error) {
      console.warn('[conversationRepository] toggleConversationFavorite error:', error.message);
      throw error;
    }
    return {
      success: Boolean(data?.success),
      isFavorited: Boolean(data?.is_favorited),
      favoritedAt: data?.favorited_at || null,
    };
  },

  /**
   * Clear conversation history for actor via atomic RPC with fallback.
   */
  async clearConversationHistory(
    conversationId: string,
    currentUserId?: string
  ): Promise<{ success: boolean; clearedHistoryAt: string }> {
    const { data, error } = await supabase.rpc('clear_chat_conversation_history_atomic', {
      p_conversation_id: conversationId,
    });

    if (error) {
      console.warn('[conversationRepository] clear_chat_conversation_history_atomic fallback:', error.message);
      if (currentUserId) {
        const fallbackIso = new Date().toISOString();
        await supabase
          .from('chat_participants')
          .update({ cleared_history_at: fallbackIso })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId);
        return { success: true, clearedHistoryAt: fallbackIso };
      }
      throw error;
    }

    return {
      success: Boolean(data?.success),
      clearedHistoryAt: data?.cleared_history_at || new Date().toISOString(),
    };
  },

  /**
   * Delete conversation for user (soft delete by marking removed_at).
   */
  async deleteConversation(conversationId: string, currentUserId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_participants')
      .update({ removed_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);

    if (error) throw error;
  },
};
