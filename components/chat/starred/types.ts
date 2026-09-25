export interface StarredMessageAttachment {
  id: string;
  kind: string;
  originalName?: string;
  name?: string;
  sizeBytes?: number;
  mimeType?: string;
  storagePath?: string;
}

export interface StarredMessageItem {
  starredId: string;
  starredAt: string;
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  conversationKind?: string;
  senderUserId: string | null;
  senderName: string;
  senderType: string;
  messageKind: string;
  body: string;
  intent?: string | null;
  structuredPayload?: Record<string, any> | null;
  createdAt: string;
  attachments?: StarredMessageAttachment[];
}

export type StarredMessagesScope = 'current' | 'all';

export interface StarredMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId?: string | null;
  conversationTitle?: string | null;
  onJumpToMessage?: (messageId: string, conversationId?: string) => void;
  onUnstarMessage?: (messageId: string) => void;
}

export interface StarredMessageCardProps {
  item: StarredMessageItem;
  scope: StarredMessagesScope;
  isDark: boolean;
  colors: any;
  onUnstar: (messageId: string) => void;
  onJumpToMessage?: (messageId: string, conversationId?: string) => void;
  onClose: () => void;
}

export interface StarredMessagesHeaderProps {
  isDark: boolean;
  colors: any;
  onClose: () => void;
}

export interface StarredMessagesScopeTabsProps {
  scope: StarredMessagesScope;
  onSelectScope: (scope: StarredMessagesScope) => void;
  isDark: boolean;
  colors: any;
}

export interface StarredMessagesSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  colors: any;
}

export interface StarredMessagesEmptyStateProps {
  loading: boolean;
  error: string | null;
  searchQuery: string;
  scope: StarredMessagesScope;
  isDark: boolean;
  colors: any;
  onRetry: () => void;
}
