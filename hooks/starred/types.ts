import type {
  StarredMessageItem,
  StarredMessagesScope,
} from '../../components/chat/starred/types';

export type { StarredMessageItem, StarredMessagesScope };

export interface UseStarredMessagesParams {
  visible: boolean;
  conversationId?: string | null;
  onUnstarMessage?: (messageId: string) => void;
}
