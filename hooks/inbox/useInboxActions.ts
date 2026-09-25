import { useState } from 'react';
import { ChatConversation } from '../../components/chat/ConversationRow';
import {
  UseInboxActionsParams,
  useConversationMutationActions,
  useConversationSafetyActions,
} from './actions';

export * from './actions/types';

export function useInboxActions({
  currentUser,
  conversations,
  setConversations,
  fetchConversations,
  sortConversations,
}: UseInboxActionsParams) {
  const [actionModalConv, setActionModalConv] = useState<ChatConversation | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [muteTargetId, setMuteTargetId] = useState<string | null>(null);
  const [muteModalVisible, setMuteModalVisible] = useState(false);

  const mutationActions = useConversationMutationActions({
    currentUser,
    conversations,
    setConversations,
    fetchConversations,
    sortConversations,
    setMuteTargetId,
    setMuteModalVisible,
    muteTargetId,
  });

  const safetyActions = useConversationSafetyActions({
    currentUser,
    setConversations,
    fetchConversations,
  });

  return {
    actionModalConv,
    setActionModalConv,
    actionModalVisible,
    setActionModalVisible,
    muteTargetId,
    setMuteTargetId,
    muteModalVisible,
    setMuteModalVisible,
    ...mutationActions,
    ...safetyActions,
  };
}
