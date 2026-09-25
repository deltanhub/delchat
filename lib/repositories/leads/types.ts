export interface BrokerageAgent {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl: string | null;
  role: string;
  agentType?: 'internal' | 'external';
  positionTitle?: string | null;
}

export interface InternalNoteItem {
  id: string;
  inquiryId?: string;
  inquiry_id?: string;
  authorUserId?: string;
  author_user_id?: string;
  authorName: string;
  author_name?: string;
  body: string;
  visibility?: 'company_only' | 'company_and_agent';
  createdAt: string;
  created_at?: string;
}

export interface AssignAgentParams {
  conversationId: string;
  currentUserId: string;
  currentAssignedAgentId?: string | null;
  selectedAgent: BrokerageAgent;
  handoffNote?: string;
}

export interface CaptureLeadParams {
  conversationId: string;
  fullName: string;
  email?: string;
  phone?: string;
  note?: string;
  currentUserId: string;
  partnerUserId?: string | null;
  listingId?: string | null;
  createdByName?: string | null;
}
