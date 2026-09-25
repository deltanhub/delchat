import type { ChatMessage } from '../../../components/chat/bubbles/types';

export interface UseThreadMessagesParams {
  conversationId: string;
  currentUser: any;
  partnerName?: string;
  partnerUserId?: string | null;
  ensureParticipantAuthorization: () => Promise<boolean>;
  clearPartnerTyping: () => void;
  sendTyping: (isTyping: boolean) => void;
}

export interface UseThreadMessagesReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  loadingMore: boolean;
  rateLimitCooldown: boolean;
  composerText: string;
  setComposerText: (text: string) => void;
  replyingToMessage: ChatMessage | null;
  setReplyingToMessage: (msg: ChatMessage | null) => void;
  starredMsgIds: Set<string>;
  fetchMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleSendCatalogListing: (listing: any) => Promise<void>;
  handleSendInquiryTemplate: (tmpl: any) => Promise<void>;
  handleSendInquiryResponse: (answers: Record<string, any>) => Promise<void>;
  handleSendEmbed: (embedUrl: string) => Promise<void>;
  handleReactToMessage: (messageId: string, emoji: string) => Promise<void>;
  handleToggleStar: (messageId: string) => Promise<void>;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  addOptimisticMessage: (msg: ChatMessage) => void;
  updateOptimisticMessage: (tempId: string, updates: Partial<ChatMessage>) => void;
  removeOptimisticMessage: (tempId: string) => void;
}
