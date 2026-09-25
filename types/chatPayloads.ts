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
