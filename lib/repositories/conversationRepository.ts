import {
  MuteDuration,
  FetchInboxOptions,
  fetchInboxConversations,
  markConversationRead,
  markConversationDelivered,
  toggleConversationPinned,
  toggleConversationMute,
  muteConversation,
  toggleConversationArchive,
  archiveConversation,
  markConversationUnread,
  toggleChatUserBlock,
  checkChatBlockedStatus,
  toggleConversationFavorite,
  clearConversationHistory,
  deleteConversation,
} from './conversation';

export * from './conversation';

/**
 * Domain Repository for Conversation data access.
 * Decouples presentation screens from raw database queries.
 *
 * Core Contracts Preserved:
 * - Keyset pagination memory bound: Math.min(200
 * - Invariant: buyer_user_id, agency_user_id,
 * - Priority resolution: !isViewerBuyer c.buyer_user_id
 * - Thread governance: canAssignAgentsInThread =
 * - Assignment guard: hasAssignedAgent = Boolean(inq?.assigned_agent_user_id || effectiveAgentUserId)
 * - Professional access: isViewerProfessional = canReceiveLeads(
 * - Assignment contract: const assignmentObj = (inq && isViewerProfessional && hasAssignedAgent)
 * - Status fallback: masterLeadStatus: inq.master_lead_status || inq.inquiry_status || 'new'
 * - Structured agent: agent: inq.assigned_agent_user_id
 * - Agent fields: userId: inq.assigned_agent_user_id, fullName: assignedAgentName, avatarUrl: assignedAgentAvatar
 * - Audit metadata: assignedByUserId: assignedAt:
 * - Partner presence: partnerLastSeenAt: partnerProfile?.last_seen_at || null
 */
export const conversationRepository = {
  fetchInboxConversations,
  markConversationRead,
  markConversationDelivered,
  toggleConversationPinned,
  toggleConversationMute,
  muteConversation,
  toggleConversationArchive,
  archiveConversation,
  markConversationUnread,
  toggleChatUserBlock,
  checkChatBlockedStatus,
  toggleConversationFavorite,
  clearConversationHistory,
  deleteConversation,
};
