export interface ChatParticipant {
  userId: string | null;
  fullName: string;
  avatarUrl: string | null;
  participantRole: string;
}

export interface ChatConversation {
  id: string;
  conversationKind: 'listing_human' | 'assistant' | 'support' | 'direct' | 'broadcast' | 'group' | string;
  title?: string;
  preview: string;
  updatedAt: string | null;
  unreadCount: number;
  latestIntent?: 'tour' | 'question' | 'availability' | 'valuation' | 'general' | null;
  partnerName: string;
  partnerSubtitle?: string;
  partnerAvatarUrl: string | null;
  partnerUserId?: string | null;
  partnerLastSeenAt?: string | null;
  isGroup?: boolean;
  participantCount?: number;
  assigned_to_user_id?: string | null;
  listing?: {
    id: string;
    title: string;
    imageUrl: string | null;
    referenceCode?: string | null;
    address?: string;
    city?: string;
    state?: string;
    listingStatus?: string | null;
    listingType?: string | null;
  } | null;
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  pinnedAt?: string | null;
  isFavorited?: boolean;
  favoritedAt?: string | null;
  clearedHistoryAt?: string | null;
  isBlocked?: boolean;
  blockedByMe?: boolean;
  canAssignAgents?: boolean;
  inquiryId?: string | null;
  agencyName?: string | null;
  assignedAgent?: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  assignment?: {
    id?: string;
    inquiryId?: string;
    leadId?: string;
    status?: string;
    assignedAgentUserId?: string | null;
    assignedAgentName?: string | null;
    assignedAgentAvatar?: string | null;
    assignedByUserId?: string | null;
    assignedAt?: string | null;
    masterLeadStatus?: string;
    handoffNote?: string | null;
    agentShareEnabled?: boolean;
    agencyUserId?: string | null;
    agencyName?: string | null;
    agent?: {
      userId: string;
      fullName: string;
      avatarUrl: string | null;
      email?: string;
      phone?: string;
    } | null;
  } | null;
}

export interface ConversationRowProps {
  conversation: ChatConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onLongPress?: (conversation: ChatConversation) => void;
}

export interface ConversationAvatarProps {
  partnerName: string;
  partnerAvatarUrl: string | null;
  unreadCount: number;
  containerBg: string;
  isDark: boolean;
}

export interface ConversationLeadBadgeProps {
  conversation: ChatConversation;
  isDark: boolean;
}

export interface ConversationRowDetailsProps {
  conversation: ChatConversation;
  isDark: boolean;
}
