import type { ChatConversation } from '../../../components/chat/ConversationRow';
import type { AppProfile } from '../../../lib/auth';

export type InboxTab =
  | 'all'
  | 'calls'
  | 'master-leads'
  | 'assigned-leads'
  | 'leads'
  | 'favourites'
  | 'support'
  | 'archived';

export interface UseInboxAuthProfileReturn {
  currentUser: any;
  currentProfile: AppProfile | null;
  inboxTabs: { key: InboxTab; label: string }[];
  canAssign: boolean;
  userIsAgent: boolean;
}

export interface UseInboxRealtimeSubscriptionParams {
  currentUser: any;
  onRefresh: () => void;
}
