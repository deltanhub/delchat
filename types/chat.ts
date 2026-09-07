export type ChatConversationKind = 'direct' | 'group';

export type ChatMessageKind =
  | 'text'
  | 'voice_note'
  | 'photo'
  | 'video'
  | 'document'
  | 'listing_card'
  | 'inquiry_form'
  | 'inquiry_response'
  | 'agent_card'
  | 'system_event'
  | 'broadcast'
  | 'embed_card'
  | 'lead_card';

export type MessageIntent = 'chat' | 'internal_note' | 'broadcast' | 'inquiry' | 'lead';

export interface ConversationParticipant {
  user_id: string;
  conversation_id: string;
  role?: string;
  joined_at?: string;
  removed_at?: string | null;
  user_profile?: {
    id: string;
    full_name?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
  };
}

export interface ChatAttachmentItem {
  id?: string;
  url: string;
  kind: 'photo' | 'video' | 'document' | 'audio';
  name?: string;
  sizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
}

export interface CallLogPayload {
  callSessionId: string;
  callStatus: string;
  callDirection: 'incoming' | 'outgoing';
  durationSeconds: number;
  callerUserId: string;
  callerName: string;
  calleeUserId: string;
  calleeName: string;
  isVideo: boolean;
  created_at: string;
}

export interface InquiryFormField {
  id: string;
  fieldName?: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
}

export interface InquiryFormPayload {
  id?: string;
  title?: string;
  fields?: InquiryFormField[];
}

export interface InquiryResponsePayload {
  inquiryId?: string;
  answers?: Record<string, string>;
  submittedAt?: string;
}

export interface AgentCardPayload {
  agent: {
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl: string | null;
    role: string;
  };
  handoffNote?: string;
}

export interface ListingCardPayload {
  id: string;
  title: string;
  price?: number;
  location?: string;
  imageUrl?: string;
}

export interface LeadCardPayload {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
}

export interface StructuredPayload {
  callLog?: CallLogPayload;
  inquiryForm?: InquiryFormPayload;
  inquiryResponse?: InquiryResponsePayload;
  attachments?: ChatAttachmentItem[];
  document?: ChatAttachmentItem;
  agentCard?: AgentCardPayload;
  embedUrl?: string;
  embedTitle?: string;
  listing?: ListingCardPayload;
  lead?: LeadCardPayload;
  isInternalOnly?: boolean;
  voiceNoteDurationSeconds?: number;
  reactions?: Record<string, string[]>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string | null;
  messageKind: ChatMessageKind;
  intent?: MessageIntent;
  attachments?: ChatAttachmentItem[];
  structuredPayload?: StructuredPayload | null;
  isStarred?: boolean;
  reactions?: Record<string, string[]>;
  replyToMessageId?: string | null;
  replyToMessageSnippet?: string | null;
  voice_note_duration_seconds?: number;
  structured_payload?: StructuredPayload | null;
  createdAt: string;
  isOptimistic?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ChatConversation {
  id: string;
  title?: string | null;
  partnerName?: string | null;
  partnerAvatarUrl?: string | null;
  partnerRole?: string | null;
  partnerLastSeenAt?: string | null;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
  lastMessageSenderId?: string | null;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isGroup?: boolean;
  participantCount?: number;
  participants?: ConversationParticipant[];
  conversationKind?: ChatConversationKind;
  listing?: ListingCardPayload | null;
  assigned_to_user_id?: string | null;
  created_at?: string;
}
