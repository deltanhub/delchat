import { ChatConversation } from '../ConversationRow';

export interface PeekMessage {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  message_kind?: string;
}

export interface ConversationActionModalProps {
  visible: boolean;
  conversation: ChatConversation | null;
  currentUserId?: string;
  onClose: () => void;
  onOpenConversation?: (conversationId: string) => void;
  onToggleArchive: (conversationId: string, currentArchived: boolean) => void;
  onToggleMute: (conversationId: string, currentMuted: boolean) => void;
  onMarkReadToggle: (conversationId: string, currentUnread: boolean) => void;
  onDeleteConversation: (conversationId: string) => void;
  onClearConversation?: (conversationId: string) => void;
  onBlockUser?: (conversation: ChatConversation) => void;
  onTogglePin?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string, currentFavorited: boolean) => void;
}

export interface ConversationPeekCardProps {
  conversation: ChatConversation;
  recentMessages: PeekMessage[];
  loading: boolean;
  currentUserId?: string;
  onOpenChat: () => void;
}

export interface ConversationContextMenuProps {
  conversation: ChatConversation;
  onClose: () => void;
  onToggleArchive: (conversationId: string, currentArchived: boolean) => void;
  onToggleMute: (conversationId: string, currentMuted: boolean) => void;
  onMarkReadToggle: (conversationId: string, currentUnread: boolean) => void;
  onDeleteConversation: (conversationId: string) => void;
  onClearConversation?: (conversationId: string) => void;
  onBlockUser?: (conversation: ChatConversation) => void;
  onTogglePin?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string, currentFavorited: boolean) => void;
}
