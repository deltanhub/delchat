import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UseStarredMessagesParams } from './starred/types';
import type { StarredMessagesScope } from '../components/chat/starred/types';
import { useStarredFetch, useStarredUnstar } from './starred';

export type { UseStarredMessagesParams };

export function useStarredMessages({
  visible,
  conversationId,
  onUnstarMessage,
}: UseStarredMessagesParams) {
  const [scope, setScope] = useState<StarredMessagesScope>(conversationId ? 'current' : 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    messages,
    setMessages,
    loading,
    error,
    fetchStarredMessages: fetchMessages,
  } = useStarredFetch();

  const { handleUnstar } = useStarredUnstar(setMessages, onUnstarMessage);

  useEffect(() => {
    setScope(conversationId ? 'current' : 'all');
  }, [conversationId]);

  const fetchStarredMessages = useCallback(() => {
    return fetchMessages(scope, conversationId);
  }, [fetchMessages, scope, conversationId]);

  useEffect(() => {
    if (visible) {
      void fetchStarredMessages();
      setSearchQuery('');
    }
  }, [visible, fetchStarredMessages]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (item) =>
        item.body?.toLowerCase().includes(q) ||
        item.senderName?.toLowerCase().includes(q) ||
        item.conversationTitle?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  return {
    scope,
    setScope,
    messages,
    loading,
    searchQuery,
    setSearchQuery,
    error,
    filteredMessages,
    fetchStarredMessages,
    handleUnstar,
  };
}
