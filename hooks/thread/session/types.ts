import type { ChatConversation } from '../../../components/chat/ConversationRow';
import type { UserProfile } from '../../../lib/auth';
import type { MuteDuration } from '../../../lib/repositories/conversationRepository';

export interface UseThreadSessionParams {
  conversationId: string;
  partnerNameParam?: string;
  titleParam?: string;
  partnerSubtitleParam?: string;
  listingIdParam?: string;
}

export interface UseThreadSessionReturn {
  currentUser: any;
  currentProfile: UserProfile | null;
  conversation: ChatConversation | null;
  setConversation: React.Dispatch<React.SetStateAction<ChatConversation | null>>;
  fetchConversationDetails: (userOverride?: any) => Promise<void>;
  ensureParticipantAuthorization: () => Promise<boolean>;
  handleUpdateLeadStatus: (newStatus: string) => Promise<void>;
  handleToggleInThreadAgentShare: () => Promise<void>;
  handleConvertToLead: (draft?: { fullName: string; email?: string; phone?: string; note?: string }) => Promise<void>;
  handleToggleArchive: () => Promise<void>;
  handleToggleMute: () => Promise<void>;
  isMuteModalVisible: boolean;
  openMuteModal: () => void;
  closeMuteModal: () => void;
  handleMuteWithDuration: (duration: MuteDuration) => Promise<void>;
  handleToggleBlock: () => Promise<void>;
  handleSubmitReport: (reason: string, details: string, messagesConsent?: boolean) => Promise<void>;
  notesCount: number;
  reportsCount: number;
  fetchInquiryCounts: (inquiryId: string) => Promise<void>;
  canReportAgent: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  dismissToast: () => void;
}
