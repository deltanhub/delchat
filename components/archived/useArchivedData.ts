import { useState, useEffect, useCallback, useMemo } from 'react';
import OfflineEngine from '../../lib/offline-engine';
import { getCurrentProfile, AppProfile } from '../../lib/auth';
import { conversationRepository } from '../../lib/repositories';
import { supabase } from '../../lib/supabase';
import { ChatConversation } from '../chat/ConversationRow';

export function useArchivedData() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<AppProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const profile = await getCurrentProfile();
      setCurrentProfile(profile);

      const fetched = await conversationRepository.fetchInboxConversations(user.id, profile);
      setConversations(fetched);
    } catch (err: any) {
      console.warn('[ArchivedChats] Fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // 0ms instant cached load
    OfflineEngine.getConversations().then((richCached) => {
      if (richCached && richCached.length > 0) {
        setConversations(richCached);
        setLoading(false);
      }
    });
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const archivedConversations = useMemo(() => {
    let list = conversations.filter((c) => c.isArchived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.partnerName.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.listing?.title?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, searchQuery]);

  return {
    conversations,
    setConversations,
    archivedConversations,
    loading,
    refreshing,
    currentUser,
    currentProfile,
    searchQuery,
    setSearchQuery,
    fetchConversations,
    onRefresh,
  };
}

export default useArchivedData;
