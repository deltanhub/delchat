import type { ChatConversation } from '../../../components/chat/ConversationRow';
import type { ChatMessage } from '../../../components/chat/MessageBubble';
import type { MasterLeadSubTab } from '../../../components/chat/crm/MasterLeadSubHeader';
import type {
  InternalNoteItem,
  MasterLeadReportItem,
  PublicUserProfile,
  AssignmentHistoryItem,
} from '../../../components/chat/crm/types';

export interface UseMasterLeadDetailsParams {
  conversation: ChatConversation;
  messages: ChatMessage[];
  activeSubTab?: MasterLeadSubTab;
  onNotesCountChange?: (count: number) => void;
  onReportsCountChange?: (count: number) => void;
}

export interface UseLeadNotesStateParams {
  inquiryId?: string;
  conversationId?: string;
  currentUserId: string | null;
  onNotesCountChange?: (count: number) => void;
}

export interface UseLeadNotesStateReturn {
  notes: InternalNoteItem[];
  loadingNotes: boolean;
  newNoteText: string;
  setNewNoteText: (val: string) => void;
  noteVisibility: 'company_only' | 'company_and_agent';
  setNoteVisibility: (vis: 'company_only' | 'company_and_agent') => void;
  postingNote: boolean;
  loadNotes: () => Promise<void>;
  handleCreateNote: () => Promise<void>;
}

export interface UseLeadHistoryReportsParams {
  inquiryId?: string;
  onReportsCountChange?: (count: number) => void;
}

export interface UseLeadHistoryReportsReturn {
  history: AssignmentHistoryItem[];
  historyProfiles: Map<string, PublicUserProfile>;
  loadingHistory: boolean;
  reports: MasterLeadReportItem[];
  loadingReports: boolean;
  loadHistory: () => Promise<void>;
  loadReports: () => Promise<void>;
}

export interface UseLeadTimelineAuditParams {
  messages: ChatMessage[];
  agentUserId?: string | null;
}

export interface UseLeadTimelineAuditReturn {
  buyerMsgCount: number;
  agentMsgCount: number;
  firstMsg?: ChatMessage;
  lastMsg?: ChatMessage;
  firstContactTime: string;
  lastContactTime: string;
  responseTimeText: string;
  firstReplySub: string;
}
