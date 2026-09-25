import { ChatMessage, ChatAttachmentItem } from '../types';

export interface TextMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
  onLongPressMessage?: (message: ChatMessage) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
}

export interface TextReactionPopoverProps {
  isCurrentUser: boolean;
  colors: any;
  isDark: boolean;
  onSelectEmoji: (emoji: string) => void;
  onOpenFullPicker: () => void;
}

export interface TextEmojiPickerModalProps {
  visible: boolean;
  colors: any;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export interface TextQuotedReplyProps {
  replyToData: {
    authorName?: string;
    body?: string;
  };
  isCurrentUser: boolean;
  isDark: boolean;
  primaryColor: string;
  placeholderColor: string;
}

export interface TextMediaGridProps {
  mediaItems: ChatAttachmentItem[];
  messageBody?: string;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
}

export interface TextDocumentListProps {
  documents: ChatAttachmentItem[];
  isCurrentUser: boolean;
  isDark: boolean;
  textColor: string;
  placeholderColor: string;
  primaryColor: string;
}

export interface TextStatusFooterProps {
  sentAt: string;
  status?: string;
  isCurrentUser: boolean;
  isStarred?: boolean;
  placeholderColor: string;
}

export interface TextReactionPillRowProps {
  reactions: Record<string, number | any>;
  isCurrentUser: boolean;
  borderColor: string;
  cardColor: string;
}

export interface TextFraudWarningProps {
  isDark: boolean;
}
