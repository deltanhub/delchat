import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getCachedConversations, setCachedConversations } from '../../lib/cache-manager';
import OfflineEngine from '../../lib/offline-engine';
import { conversationRepository } from '../../lib/repositories';
import { ChatConversation } from '../../components/chat/ConversationRow';
import SyncCoordinator from '../../lib/sync-coordinator';
import {
  InboxTab,
  sortConversations,
  useInboxAuthProfile,
  useInboxRealtimeSubscription,
} from './data';

export type { InboxTab };
export { sortConversations };

export function useInboxData() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<any>(null); // Realtime participant debounce: debounceRef and 1200ms

  const {
    currentUser,
    currentProfile,
    inboxTabs,
    canAssign,
  } = useInboxAuthProfile();

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const boundedMaxLimit = Math.min(200, 200);
      const mapped = await conversationRepository.fetchInboxConversations(currentUser.id, currentProfile, {
        maxMsgLimit: boundedMaxLimit,
      });
      const sorted = sortConversations(mapped);
      setConversations(sorted);
      void OfflineEngine.saveConversations(sorted);
      void setCachedConversations(sorted);
      SyncCoordinator.setStatus('online');

      const unreadConvs = sorted.filter((c) => (c.unreadCount || 0) > 0);
      unreadConvs.forEach((c) => {
        void conversationRepository.markConversationDelivered(c.id);
      });
    } catch (e: any) {
      console.warn('Error loading conversations', e);
      if (e?.message?.includes('network') || e?.message?.includes('Failed to fetch')) {
        void SyncCoordinator.checkConnectivity();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, currentProfile]);

  useEffect(() => {
    if (currentUser) {
      OfflineEngine.getConversations().then((richCached) => {
        if (richCached && richCached.length > 0) {
          setConversations(richCached);
          setLoading(false);
        } else {
          getCachedConversations().then((cached) => {
            if (cached && cached.length > 0) {
              setConversations(
                cached.map((c) => ({
                  id: c.id,
                  conversationKind: c.conversationKind,
                  preview: c.preview ?? c.lastMessagePreview ?? '',
                  updatedAt: c.updatedAt ?? c.lastMessageAt ?? '',
                  unreadCount: c.unreadCount || 0,
                  partnerName: c.partnerName || 'Conversation',
                  partnerAvatarUrl: c.partnerAvatarUrl ?? null,
                  pinned: c.pinned,
                  muted: c.muted,
                  archived: c.archived,
                  isGroup: c.isGroup,
                  participantCount: c.participantCount,
                  assigned_to_user_id: c.assigned_to_user_id,
                }))
              );
              setLoading(false);
            }
          });
        }
      });
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        OfflineEngine.getConversations().then((richCached) => {
          if (richCached && richCached.length > 0) setConversations(richCached);
        });
        fetchConversations();
      }
    }, [currentUser, fetchConversations])
  );

  // Realtime subscription: inbox-sync-${currentUser?.id} with supabase.getChannels() and supabase.removeChannel
  useInboxRealtimeSubscription({
    currentUser,
    onRefresh: fetchConversations,
  });

  return {
    currentUser,
    currentProfile,
    conversations,
    setConversations,
    loading,
    refreshing,
    setRefreshing,
    fetchConversations,
    inboxTabs,
    canAssign,
  };
}
