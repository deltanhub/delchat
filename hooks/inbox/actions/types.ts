import { ChatConversation } from '../../../components/chat/ConversationRow';

export interface UseInboxActionsParams {
  currentUser: any;
  conversations: ChatConversation[];
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  fetchConversations: () => Promise<void>;
  sortConversations: (list: ChatConversation[]) => ChatConversation[];
}
