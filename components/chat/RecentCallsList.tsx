import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';
import { supabase } from '../../lib/supabase';
import { resolveAvatarUrl } from '../../lib/media-utils';
import {
  callRepository,
  ChatCallLog,
  GroupedChatCallLog,
} from '../../lib/repositories/callRepository';

interface RecentCallsListProps {
  currentUserId: string;
  searchQuery: string;
  onSelectConversation: (conversationId: string, partnerName: string) => void;
}

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

  // Targeted Realtime subscription on chat_call_participants strictly filtered to currentUserId
  // Prevents global 500k CCU listener DoS cascades
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
    // 500k CCU Deduplication Guard: Safely purge any existing channel instance before subscribing
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) {
      void supabase.removeChannel(existing);
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
    };
  }, [currentUserId, fetchLogs]);

  // Group consecutive calls matching DeltanHub web (chats-workspace.tsx lines 2968-3007)
  const groupedLogs = useMemo(() => {
    return callRepository.groupCallLogs(callLogs, searchQuery);
  }, [callLogs, searchQuery]);

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

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading && callLogs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && callLogs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={isDark ? '#f87171' : '#9d263d'} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load call logs</Text>
        <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>{error}</Text>
      </View>
    );
  }

  if (groupedLogs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="call-outline" size={52} color={colors.placeholder} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Recent Calls</Text>
        <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
          {searchQuery
            ? 'No call records matched your search.'
            : 'Calls you place or receive will show up here.'}
        </Text>
      </View>
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
      renderItem={({ item: log }) => {
        const isMissed = log.direction === 'missed';
        const isOutgoing = log.direction === 'outgoing';
        const isVideo = log.callMode === 'video';

        const directionColor = isOutgoing
          ? isDark
            ? '#94a3b8'
            : '#718096'
          : isMissed
          ? isDark
            ? '#f87171'
            : '#9d263d'
          : isDark
          ? '#4ade80'
          : '#16a34a';

        const resolvedAvatar = resolveAvatarUrl(log.peer.avatarUrl);

        return (
          <ScalePressable
            onPress={() => onSelectConversation(log.conversationId, log.peer.displayName)}
            style={[
              styles.rowItem,
              {
                backgroundColor: colors.background,
                borderBottomColor: isDark ? '#262626' : '#edf2f7',
              },
            ]}
          >
            {/* Avatar Column */}
            <View style={styles.avatarContainer}>
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: isDark ? '#262626' : colors.primarySoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarFallbackText,
                      { color: isDark ? '#ffffff' : colors.primary },
                    ]}
                  >
                    {getInitials(log.peer.displayName)}
                  </Text>
                </View>
              )}
            </View>

            {/* Details Column */}
            <View style={styles.detailsContainer}>
              <Text
                style={[
                  styles.peerName,
                  { color: isMissed ? (isDark ? '#f87171' : '#9d263d') : colors.text },
                ]}
                numberOfLines={1}
              >
                {log.peer.displayName}
              </Text>

              <View style={styles.subtitleRow}>
                <Ionicons
                  name={
                    isOutgoing
                      ? 'arrow-up'
                      : isMissed
                      ? 'arrow-down'
                      : 'arrow-down'
                  }
                  size={13}
                  color={directionColor}
                  style={isOutgoing ? { transform: [{ rotate: '45deg' }] } : { transform: [{ rotate: '45deg' }] }}
                />
                <Text style={[styles.subtitleText, { color: colors.placeholder }]}>
                  {isOutgoing ? 'Outgoing' : isMissed ? 'Missed' : 'Incoming'}
                  {log.count > 1 ? ` (${log.count})` : ''}
                  {' • '}
                  {isVideo ? 'Video' : 'Voice'}
                </Text>
              </View>
            </View>

            {/* Right Meta Column: Time & Redial Buttons */}
            <View style={styles.rightContainer}>
              <Text style={[styles.timeText, { color: colors.placeholder }]}>
                {callRepository.formatCallTime(log.startedAt)}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => handleRedial(log, 'audio')}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark ? '#262626' : '#f1f5f9',
                      borderColor: isDark ? '#383838' : '#e2e8f0',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Call back voice"
                >
                  <Ionicons name="call" size={15} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRedial(log, 'video')}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark ? '#262626' : '#f1f5f9',
                      borderColor: isDark ? '#383838' : '#e2e8f0',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Call back video"
                >
                  <Ionicons name="videocam" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </ScalePressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    minHeight: 280,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  detailsContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  peerName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  subtitleText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  rightContainer: {
    alignItems: 'flex-end',
    marginLeft: 10,
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
