export const CONVERSATIONS_STORAGE_KEY = '@delchat_offline_conversations';
export const MESSAGES_PREFIX = '@delchat_offline_msgs:';
export const OUTBOX_STORAGE_KEY = '@delchat_offline_outbox';
export const MAX_CACHED_MESSAGES_PER_THREAD = 300;

export interface OutboxItem {
  id: string; // Temporary ID (e.g. optimistic-1725...)
  conversationId: string;
  senderUserId: string;
  messageKind:
    | 'text'
    | 'voice_note'
    | 'attachments'
    | 'inquiry_form'
    | 'inquiry_response'
    | 'listing_card';
  body: string;
  intent?: string | null;
  structuredPayload?: any;
  // Local media payload if pending upload
  localMediaUri?: string;
  mediaKind?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  mimeType?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  createdAt: string;
  retryCount: number;
  error?: string | null;
}
