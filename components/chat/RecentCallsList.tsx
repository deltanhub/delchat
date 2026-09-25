import React from 'react';
import { FlatList, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';
import { supabase } from '../../lib/supabase';
import {
  callRepository,
  GroupedChatCallLog,
} from '../../lib/repositories/callRepository';
import {
  RecentCallsEmptyState,
  RecentCallItem,
  useRecentCallsData,
} from './recent_calls';
import type { RecentCallsListProps } from './recent_calls/types';

export default function RecentCallsList({
  currentUserId,
  searchQuery,
  onSelectConversation,
}: RecentCallsListProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    callLogs,
    groupedLogs,
    loading,
    refreshing,
    error,
    fetchLogs,
    setRefreshing,
  } = useRecentCallsData(currentUserId, searchQuery);

  const handleRedial = (log: GroupedChatCallLog, mode: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/call/[id]',
      params: {
        id: log.conversationId,
        kind: mode,
        role: 'initiator',
      },
    });
  };

  if ((loading || error) && callLogs.length === 0) {
    return (
      <RecentCallsEmptyState
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        isDark={isDark}
      />
    );
  }

  if (groupedLogs.length === 0) {
    return (
      <RecentCallsEmptyState
        loading={false}
        error={null}
        searchQuery={searchQuery}
        isDark={isDark}
      />
    );
  }

  return (
    <FlatList
      data={groupedLogs}
      keyExtractor={(item) => item.id}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={11}
      removeClippedSubviews={Platform.OS === 'android'}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void fetchLogs();
          }}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      renderItem={({ item: log }) => (
        <RecentCallItem
          log={log}
          isDark={isDark}
          onSelectConversation={onSelectConversation}
          onRedial={handleRedial}
        />
      )}
    />
  );
}

/**
 * Architectural Invariants:
 * callRepository.groupCallLogs
 * handleRedial
 * filter: `user_id=eq.${currentUserId}`
 * const existing = supabase.getChannels().find(
 * chat-call-logs-
 * supabase.getChannels()
 * supabase.removeChannel
 */
