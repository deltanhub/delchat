import type { GroupedChatCallLog } from '../../../lib/repositories/callRepository';

export interface RecentCallsListProps {
  currentUserId: string;
  searchQuery: string;
  onSelectConversation: (conversationId: string, partnerName: string) => void;
}

export interface RecentCallItemProps {
  log: GroupedChatCallLog;
  isDark: boolean;
  onSelectConversation: (conversationId: string, partnerName: string) => void;
  onRedial: (log: GroupedChatCallLog, mode: 'audio' | 'video') => void;
}

export interface RecentCallsEmptyStateProps {
  loading: boolean;
  error: string | null;
  searchQuery: string;
  isDark: boolean;
}
