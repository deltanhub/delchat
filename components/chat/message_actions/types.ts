import type { ChatMessage } from '../MessageBubble';

export interface MessageActionModalProps {
  visible: boolean;
  message: ChatMessage | null;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onStarToggle?: (messageId: string) => void;
  onAskAI?: (message: ChatMessage) => void;
  onInfo?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
}

export interface QuickReactionPillProps {
  emojis: string[];
  isCurrentUser: boolean;
  isDark: boolean;
  onSelectEmoji: (emoji: string) => void;
}

export interface ElevatedMessagePreviewProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isDark: boolean;
}

export interface MessageActionMenuListProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred: boolean;
  isDark: boolean;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onStarToggle: () => void;
  onAskAI?: () => void;
  onInfo?: () => void;
  onDelete?: () => void;
}
