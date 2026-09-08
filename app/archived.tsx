import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../components/useColorScheme';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';
import ScalePressable from '../components/ScalePressable';
import * as Haptics from '../lib/haptics';
import OfflineEngine from '../lib/offline-engine';
import { getCurrentProfile, AppProfile } from '../lib/auth';
import { conversationRepository } from '../lib/repositories';
import { supabase } from '../lib/supabase';
import ConversationRow, { ChatConversation } from '../components/chat/ConversationRow';
import ConversationActionModal from '../components/chat/ConversationActionModal';
import MuteDurationModal from '../components/chat/MuteDurationModal';
import type { MuteDuration } from '../lib/repositories/conversationRepository';

export default function ArchivedChatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<AppProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Long-press Action Modal
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionModalConv, setActionModalConv] = useState<ChatConversation | null>(null);

  // Mute Duration Modal (WhatsApp/Telegram Parity)
  const [muteTargetId, setMuteTargetId] = useState<string | null>(null);
  const [muteModalVisible, setMuteModalVisible] = useState(false);

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

  const handleOpenConversation = (conversationId: string) => {
    const target = conversations.find((c) => c.id === conversationId);
    router.push({
      pathname: '/thread/[id]',
      params: {
        id: conversationId,
        partnerName: target?.partnerName || 'Chat',
        title: target?.title || '',
        partnerSubtitle: target?.partnerSubtitle || target?.listing?.title || '',
        listingId: target?.listing?.id || '',
      },
    });
  };

  const handleToggleArchive = async (conversationId: string, currentArchived: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const willArchive = !currentArchived;
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: willArchive } : c))
      );
      if (currentUser?.id) {
        await conversationRepository.toggleConversationArchive(conversationId, currentUser.id, willArchive);
      }
    } catch (e: any) {
      Alert.alert('Archive Error', e?.message || 'Unable to update archive status.');
      fetchConversations();
    }
  };

  const handleToggleMute = async (conversationId: string, currentMuted: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMuted) {
      // Currently muted → immediately unmute
      try {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isMuted: false } : c))
        );
        if (currentUser?.id) {
          await conversationRepository.toggleConversationMute(conversationId, currentUser.id, false);
        }
      } catch (e: any) {
        Alert.alert('Mute Error', e?.message || 'Unable to update mute status.');
        fetchConversations();
      }
    } else {
      // Currently unmuted → open duration picker
      setMuteTargetId(conversationId);
      setMuteModalVisible(true);
    }
  };

  const handleArchivedMuteWithDuration = async (duration: MuteDuration) => {
    setMuteModalVisible(false);
    if (!muteTargetId || !currentUser?.id) return;
    if (duration === 'unmute') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === muteTargetId ? { ...c, isMuted: true } : c))
      );
      await conversationRepository.toggleConversationMute(muteTargetId, currentUser.id, true, duration);
    } catch (e: any) {
      Alert.alert('Mute Error', e?.message || 'Unable to update mute status.');
      fetchConversations();
    }
    setMuteTargetId(null);
  };

  const handleMarkReadToggle = async (conversationId: string, currentUnread: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: currentUnread ? 0 : 1 } : c))
      );
      if (currentUnread) {
        await conversationRepository.markConversationRead(conversationId);
      } else if (currentUser?.id) {
        await conversationRepository.markConversationUnread(conversationId, currentUser.id);
      }
    } catch (e: any) {
      Alert.alert('Read Receipt Error', e?.message || 'Unable to update status.');
    }
  };

  const handleTogglePin = async (conversationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const target = conversations.find((c) => c.id === conversationId);
      const willPin = !target?.isPinned;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, isPinned: willPin, pinnedAt: willPin ? new Date().toISOString() : null }
            : c
        )
      );
      await conversationRepository.toggleConversationPinned(conversationId, willPin);
    } catch (e: any) {
      Alert.alert('Pin Error', e?.message || 'Unable to update pin status.');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to remove this chat from your archived chats?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            if (currentUser?.id) {
              await supabase
                .from('chat_participants')
                .update({ removed_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUser.id);
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (conversationId: string, currentFavorited: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const willFavorite = !currentFavorited;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, isFavorited: willFavorite, favoritedAt: willFavorite ? new Date().toISOString() : null }
            : c
        )
      );
      await conversationRepository.toggleConversationFavorite(conversationId, willFavorite);
    } catch (e: any) {
      Alert.alert('Favourites Error', e?.message || 'Unable to update favourite status.');
      fetchConversations();
    }
  };

  const handleClearConversation = async (conversationId: string) => {
    Alert.alert(
      'Clear Chat Messages',
      'Are you sure you want to clear all messages in this chat? Your chat history will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const res = await conversationRepository.clearConversationHistory(conversationId, currentUser?.id);
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === conversationId
                    ? {
                        ...c,
                        preview: 'No messages yet',
                        unreadCount: 0,
                        clearedHistoryAt: res.clearedHistoryAt,
                      }
                    : c
                )
              );
            } catch (e: any) {
              Alert.alert('Clear Chat Error', e?.message || 'Unable to clear conversation history.');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (conversation: ChatConversation) => {
    const partnerId = conversation.partnerUserId;
    if (!partnerId) {
      Alert.alert('Error', 'Unable to resolve contact to block.');
      return;
    }
    const isCurrentlyBlocked = Boolean(conversation.isBlocked);
    Alert.alert(
      isCurrentlyBlocked ? 'Unblock Contact' : 'Block Contact',
      isCurrentlyBlocked
        ? `Are you sure you want to unblock ${conversation.partnerName}?`
        : `Are you sure you want to block ${conversation.partnerName}? They will not be able to message or call you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyBlocked ? 'Unblock' : 'Block',
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const blocked = await conversationRepository.toggleChatUserBlock(partnerId);
              setConversations((prev) =>
                prev.map((c) =>
                  c.partnerUserId === partnerId
                    ? { ...c, isBlocked: blocked, blockedByMe: blocked }
                    : c
                )
              );
            } catch (e: any) {
              Alert.alert('Block Error', e?.message || 'Unable to update contact block state.');
            }
          },
        },
      ]
    );
  };

  const accentColor = isDark ? '#f4a5b8' : colors.primary;

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* WhatsApp-Style Edge-to-Edge Navigation Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: isDark ? '#121212' : '#ffffff',
              borderBottomColor: colors.border,
            },
          ]}
        >
          <ScalePressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to chats"
          >
            <Ionicons name="chevron-back" size={24} color={accentColor} />
            <Text style={[styles.backText, { color: accentColor }]}>Chats</Text>
          </ScalePressable>

          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Archived Chats
          </Text>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* Search Box */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? '#1f1f1f' : '#e8edf3', borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.placeholder} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search archived chats..."
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        {/* Main Feed */}
        {loading && conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : archivedConversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="archive-outline" size={54} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Chats</Text>
            <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
              {searchQuery
                ? 'No archived chats match your search query.'
                : 'Chats you archive will remain safely stored here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={archivedConversations}
            keyExtractor={(item) => item.id}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={11}
            removeClippedSubviews={Platform.OS === 'android'}
            ListHeaderComponent={
              <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1a1a1a' : '#f0f4f9' }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.placeholder} style={{ marginRight: 8 }} />
                <Text style={[styles.infoBannerText, { color: colors.placeholder }]}>
                  These chats stay archived when new messages are received.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchConversations();
                }}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                isActive={false}
                onSelect={handleOpenConversation}
                onLongPress={(conv) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setActionModalConv(conv);
                  setActionModalVisible(true);
                }}
              />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          />
        )}

        {/* Long-Press Action Modal */}
        <ConversationActionModal
          visible={actionModalVisible}
          conversation={actionModalConv}
          currentUserId={currentUser?.id}
          onClose={() => setActionModalVisible(false)}
          onOpenConversation={(id) => handleOpenConversation(id)}
          onToggleArchive={(id, cur) => handleToggleArchive(id, cur)}
          onToggleMute={(id, cur) => handleToggleMute(id, cur)}
          onMarkReadToggle={(id, cur) => handleMarkReadToggle(id, cur)}
          onTogglePin={(id) => handleTogglePin(id)}
          onDeleteConversation={(id) => handleDeleteConversation(id)}
          onClearConversation={(id) => handleClearConversation(id)}
          onBlockUser={(conv) => handleBlockUser(conv)}
          onToggleFavorite={(id, cur) => handleToggleFavorite(id, cur)}
        />

        {/* WhatsApp/Telegram-Style Mute Duration Picker */}
        <MuteDurationModal
          visible={muteModalVisible}
          onClose={() => { setMuteModalVisible(false); setMuteTargetId(null); }}
          onSelect={handleArchivedMuteWithDuration}
        />
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
  },
  backText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fontFamily,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  headerRightSpacer: {
    minWidth: 70,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    paddingVertical: 0,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  infoBannerText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    flex: 1,
    lineHeight: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
