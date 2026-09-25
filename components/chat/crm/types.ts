import type { ChatConversation } from '../ConversationRow';
import type { ChatMessage } from '../MessageBubble';
import type { MasterLeadSubTab } from './MasterLeadSubHeader';

export interface InternalNoteItem {
  id: string;
  inquiry_id: string;
  author_user_id: string;
  author_name?: string;
  body: string;
  visibility: 'company_only' | 'company_and_agent';
  created_at: string;
}

export interface MasterLeadReportItem {
  id: string;
  inquiry_id: string;
  reporter_user_id: string;
  reporter_name?: string;
  reason: string;
  details?: string;
  messages_consent: boolean;
  messages_consent_at?: string;
  report_status: string;
  resolution_note?: string;
  resolved_by_user_id?: string;
  created_at: string;
  resolved_at?: string;
}

export interface PublicUserProfile {
  user_id: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

export interface AssignmentHistoryItem {
  id: string;
  action_kind: string;
  assigned_agent_user_id?: string | null;
  assigned_by_user_id?: string | null;
  note?: string | null;
  created_at: string;
}

export interface MasterLeadDetailsViewProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  activeSubTab?: MasterLeadSubTab;
  onOpenInternalNotes?: () => void;
  onNotesCountChange?: (count: number) => void;
  onReportsCountChange?: (count: number) => void;
}
