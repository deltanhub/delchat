import type { ChatConversation } from '../ConversationRow';

export interface ChatInfoModalProps {
  visible: boolean;
  conversation: ChatConversation | null;
  messagesCount: number;
  onClose: () => void;
  onAddAsLead: () => void;
  onToggleArchive: () => void;
  onViewStarred?: () => void;
  onReportAgent?: () => void;
}

export interface ChatInfoProfileCardProps {
  conversation: ChatConversation;
  isDark: boolean;
}

export interface ChatInfoPropertySectionProps {
  conversation: ChatConversation;
  onClose: () => void;
}

export interface ChatInfoDetailsSectionProps {
  conversation: ChatConversation;
  messagesCount: number;
}

export interface ChatInfoActionButtonsProps {
  conversation: ChatConversation;
  isDark: boolean;
  onClose: () => void;
  onAddAsLead: () => void;
  onToggleArchive: () => void;
  onViewStarred?: () => void;
  onReportAgent?: () => void;
}
