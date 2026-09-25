import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  callRepository,
  ChatCallLog,
  GroupedChatCallLog,
} from '../../../lib/repositories/callRepository';

export function useRecentCallsData(currentUserId: string, searchQuery: string) {
  const [callLogs, setCallLogs] = useState<ChatCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setError(null);
      const logs = await callRepository.fetchCallLogs(currentUserId);
      setCallLogs(logs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!currentUserId) return;

    let debounceTimer: any = null;
    const triggerDebouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void fetchLogs();
      }, 1000);
    };

    const channelName = `chat-call-logs-${currentUserId}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) {
      void supabase.removeChannel(existing);
      (supabase.realtime as any)?._remove?.(existing);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_call_participants',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          triggerDebouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
      (supabase.realtime as any)?._remove?.(channel);
    };
  }, [currentUserId, fetchLogs]);

  const groupedLogs = useMemo(() => {
    return callRepository.groupCallLogs(callLogs, searchQuery);
  }, [callLogs, searchQuery]);

  return {
    callLogs,
    groupedLogs,
    loading,
    refreshing,
    error,
    fetchLogs,
    setRefreshing,
  };
}
