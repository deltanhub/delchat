import { ChatMessage } from '../../../components/chat/bubbles/types';

export interface DbMessageRow {
  id: string;
  conversation_id: string;
  sender_type?: 'user' | 'assistant' | 'system' | 'admin';
  sender_user_id: string | null;
  sender_assistant_key?: string | null;
  message_kind?: ChatMessage['messageKind'];
  body?: string | null;
  intent?: string | null;
  structured_payload?: Record<string, any> | null;
  reactions?: Record<string, string[]> | null;
  created_at: string;
  message_status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  delivered_at?: string | null;
  read_at?: string | null;
}

export interface FetchMessagesParams {
  conversationId: string;
  currentUserId: string;
  limit?: number;
  beforeTimestamp?: string | null;
  partnerLastReadTime?: number | null;
  clearedHistoryAt?: string | null;
}

export interface FetchMessagesResult {
  messages: ChatMessage[];
  hasMore: boolean;
  starredMsgIds: Set<string>;
}

export interface SendTextMessageParams {
  conversationId: string;
  senderUserId: string;
  body: string;
  intent?: string;
  replySnapshot?: {
    id: string;
    authorName?: string;
    body?: string;
  } | null;
}

export interface SendVoiceNoteMessageParams {
  conversationId: string;
  senderUserId: string;
  durationSeconds: number;
  audioUrl: string;
  localUri: string;
  fileName: string;
}

export interface SendDocumentMessageParams {
  conversationId: string;
  senderUserId: string;
  docName: string;
  docSize: number;
  mimeType: string;
  signedUrl: string;
  fileName: string;
}

export interface SendListingMessageParams {
  conversationId: string;
  senderUserId: string;
  listing: {
    id: string;
    title: string;
    price?: string;
    location?: string;
    imageUrl?: string;
    referenceCode?: string;
    listingStatus?: string;
  };
}

export interface SendEmbedMessageParams {
  conversationId: string;
  senderUserId: string;
  embedUrl: string;
  title?: string;
}

export interface SendInquiryTemplateParams {
  conversationId: string;
  senderUserId: string;
  templateId: string;
  templateTitle: string;
  fields: Array<{
    id: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
    isRequired: boolean;
    options?: string[];
  }>;
}

export interface SendInquiryResponseParams {
  conversationId: string;
  senderUserId: string;
  answers: Record<string, any>;
}
