import { useState, useMemo } from 'react';
import { useInboxData, sortConversations, InboxTab } from './useInboxData';
import { useInboxActions } from './useInboxActions';

export { InboxTab } from './useInboxData';

export function useInbox() {
  const data = useInboxData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredModalVisible, setStarredModalVisible] = useState(false);

  const actions = useInboxActions({
    currentUser: data.currentUser,
    conversations: data.conversations,
    setConversations: data.setConversations,
    fetchConversations: data.fetchConversations,
    sortConversations,
  });

  const filteredConversations = useMemo(() => {
    return data.conversations.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.partnerName.toLowerCase().includes(q);
        const matchPreview = c.preview.toLowerCase().includes(q);
        const matchListing = c.listing?.title.toLowerCase().includes(q);
        if (!matchName && !matchPreview && !matchListing) return false;
      }
      if (unreadOnly && c.unreadCount === 0) return false;
      if (activeTab === 'archived') return c.isArchived;
      if (c.isArchived) return false;
      if (activeTab === 'master-leads') return Boolean(c.assignment && (c.canAssignAgents ?? data.canAssign));
      if (activeTab === 'assigned-leads') return Boolean(c.assignment && c.assignment.assignedAgentUserId === data.currentUser?.id);
      if (activeTab === 'leads') return Boolean(c.assignment || c.conversationKind === 'listing_human' || Boolean(c.listing));
      if (activeTab === 'favourites') return Boolean(c.isFavorited);
      if (activeTab === 'support') return c.conversationKind === 'support';
      return true;
    });
  }, [data.conversations, searchQuery, unreadOnly, activeTab, data.canAssign, data.currentUser?.id]);

  return {
    ...data,
    ...actions,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    unreadOnly,
    setUnreadOnly,
    starredModalVisible,
    setStarredModalVisible,
    filteredConversations,
  };
}
