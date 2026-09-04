import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import ScalePressable from '../../components/ScalePressable';
import * as Haptics from '../../lib/haptics';
import { resolveAvatarUrl, resolveListingImageUrl } from '../../lib/media-utils';
import { getCachedConversations, setCachedConversations } from '../../lib/cache-manager';
import OfflineEngine from '../../lib/offline-engine';

// Modular Components
import ConversationRow, { ChatConversation } from '../../components/chat/ConversationRow';
import ConversationActionModal from '../../components/chat/ConversationActionModal';
import StarredMessagesModal from '../../components/chat/StarredMessagesModal';
import ConnectionBanner from '../../components/chat/ConnectionBanner';

type InboxTab = 'all' | 'leads' | 'support' | 'archived';

export default function InboxScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredModalVisible, setStarredModalVisible] = useState(false);

  // Conversation Action Modal
  const [actionModalConv, setActionModalConv] = useState<ChatConversation | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const debounceRef = useRef<any>(null);

  // 1. Authenticate user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
    });
  }, []);

  const sortConversations = (list: ChatConversation[]): ChatConversation[] => {
    return [...list].sort((a, b) => {
      // 1. Pinned conversations always take precedence
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        const aPin = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bPin = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        if (bPin !== aPin) return bPin - aPin;
      }
      // 2. Unpinned sorted by latest message time
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  };

  // 2. Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      // 1. Get participant rows for currentUser
      const { data: participations, error: partErr } = await supabase
        .from('chat_participants')
        .select('conversation_id, participant_role, last_read_at, archived_at, muted_until, pinned_at')
        .eq('user_id', currentUser.id)
        .is('removed_at', null);

      if (partErr) throw partErr;

      const convIds = (participations || []).map((p) => p.conversation_id);
      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Query conversations with linked listing
      const { data: convRows, error: convErr } = await supabase
        .from('chat_conversations')
        .select(`
          id, conversation_kind, title, updated_at,
          listing_id,
          listing:listings (id, title, cover_image_url)
        `)
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (convErr) throw convErr;

      // 3. Query participants of these conversations to find partner
      const { data: allParticipants } = await supabase
        .from('chat_participants')
        .select('conversation_id, user_id, participant_role')
        .in('conversation_id', convIds);

      const partnerUserIds = Array.from(
        new Set(
          (allParticipants || [])
            .filter((p) => p.user_id !== currentUser.id)
            .map((p) => p.user_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      // 4. Resolve partner user profiles
      const profileMap = new Map<string, any>();
      if (partnerUserIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: partnerUserIds,
        });
        profiles?.forEach((p: any) => {
          profileMap.set(p.user_id, p);
        });
      }

      // 5. Query last message and unread count per conversation (bounded to prevent mobile OOM)
      const maxMsgLimit = Math.min(200, Math.max(50, convIds.length * 4));
      const { data: latestMessages } = await supabase
        .from('chat_messages')
        .select('conversation_id, body, message_kind, created_at, sender_user_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(maxMsgLimit);

      const lastMsgMap = new Map<string, any>();
      const unreadMap = new Map<string, number>();

      const partMap = new Map(participations?.map((p) => [p.conversation_id, p]));

      latestMessages?.forEach((msg) => {
        if (!lastMsgMap.has(msg.conversation_id)) {
          lastMsgMap.set(msg.conversation_id, msg);
        }
        const part = partMap.get(msg.conversation_id);
        const lastReadTime = part?.last_read_at ? new Date(part.last_read_at).getTime() : 0;
        const msgTime = new Date(msg.created_at).getTime();

        if (msg.sender_user_id !== currentUser.id && msgTime > lastReadTime) {
          unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
        }
      });

      // 6. Map to ChatConversation
      const mapped: ChatConversation[] = (convRows || []).map((c: any) => {
        const part = partMap.get(c.id);
        const partnerPart = (allParticipants || []).find(
          (p) => p.conversation_id === c.id && p.user_id !== currentUser.id
        );
        const partnerProfile = partnerPart?.user_id ? profileMap.get(partnerPart.user_id) : null;

        const partnerName =
          partnerProfile?.display_name?.trim() ||
          partnerProfile?.full_name?.trim() ||
          c.title ||
          'DeltanHub Member';

        const lastMsg = lastMsgMap.get(c.id);
        const previewText = lastMsg
          ? lastMsg.message_kind === 'voice_note'
            ? '🎤 Voice note'
            : lastMsg.message_kind === 'attachments'
            ? '📷 Photo attachment'
            : lastMsg.body || 'No messages yet'
          : 'No messages yet';

        const listingObj = Array.isArray(c.listing) ? c.listing[0] : c.listing;

        return {
          id: c.id,
          conversationKind: c.conversation_kind || 'direct',
          title: c.title || partnerName,
          preview: previewText,
          updatedAt: lastMsg?.created_at || c.updated_at || null,
          unreadCount: unreadMap.get(c.id) || 0,
          latestIntent: 'general',
          partnerName: partnerName,
          partnerSubtitle: listingObj?.title || 'Direct Conversation',
          partnerAvatarUrl: resolveAvatarUrl(partnerProfile?.avatar_url),
          partnerUserId: partnerPart?.user_id || null,
          isArchived: Boolean(part?.archived_at),
          isMuted: Boolean(part?.muted_until && new Date(part.muted_until).getTime() > Date.now()),
          isPinned: Boolean(part?.pinned_at),
          pinnedAt: part?.pinned_at || null,
          listing: listingObj ? {
            id: listingObj.id,
            title: listingObj.title,
            imageUrl: resolveListingImageUrl(listingObj.cover_image_url),
          } : null,
        };
      });

      const sorted = sortConversations(mapped);
      setConversations(sorted);
      void OfflineEngine.saveConversations(sorted);
      void setCachedConversations(sorted);
    } catch (e) {
      console.warn('Error loading conversations', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Load rich cache immediately
      OfflineEngine.getConversations().then((richCached) => {
        if (richCached && richCached.length > 0) {
          setConversations(richCached);
          setLoading(false);
        } else {
          getCachedConversations().then((cached) => {
            if (cached && cached.length > 0) {
              setConversations(cached as any);
              setLoading(false);
            }
          });
        }
      });
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  // 3. Realtime inbox sync (targeted user-scoped notifications & participant changes with debouncing)
  useEffect(() => {
    if (!currentUser) return;

    const triggerDebouncedFetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchConversations();
      }, 1200);
    };

    // User-scoped channel: eliminates global chat_messages broadcast storm
    const updateChannel = supabase
      .channel(`inbox-sync-${currentUser.id}`)
      // 1. In-app notification received for this user
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          triggerDebouncedFetch();
        }
      )
      // 2. Participant row updated (read receipts, pinned status, archive) for this user
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          triggerDebouncedFetch();
        }
      )
      // 3. User-targeted broadcast alert
      .on('broadcast', { event: 'new_message' }, () => {
        triggerDebouncedFetch();
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(updateChannel);
    };
  }, [currentUser, fetchConversations]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.partnerName.toLowerCase().includes(q);
      const matchPreview = c.preview.toLowerCase().includes(q);
      const matchListing = c.listing?.title.toLowerCase().includes(q);
      if (!matchName && !matchPreview && !matchListing) return false;
    }

    // Unread filter
    if (unreadOnly && c.unreadCount === 0) {
      return false;
    }

    // Tab filter
    if (activeTab === 'archived') {
      return c.isArchived;
    }
    if (c.isArchived) {
      return false; // Don't show archived in other tabs
    }
    if (activeTab === 'leads') {
      return c.conversationKind === 'listing_human' || Boolean(c.listing);
    }
    if (activeTab === 'support') {
      return c.conversationKind === 'support';
    }
    return true;
  });

  const handleOpenConversation = (conversationId: string) => {
    const target = conversations.find((c) => c.id === conversationId);
    router.push({
      pathname: '/thread/[id]',
      params: {
        id: conversationId,
        partnerName: target?.partnerName || 'Chat',
        title: target?.title || '',
      },
    });
  };

  const handleToggleArchive = async (conversationId: string, currentArchived: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: !currentArchived } : c))
      );
      await supabase
        .from('chat_participants')
        .update({ archived_at: currentArchived ? null : new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleMute = async (conversationId: string, currentMuted: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const muteUntil = currentMuted
        ? null
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isMuted: !currentMuted } : c))
      );
      await supabase
        .from('chat_participants')
        .update({ muted_until: muteUntil })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleMarkReadToggle = async (conversationId: string, currentUnread: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: currentUnread ? 0 : 1 } : c))
      );
      if (currentUnread) {
        await supabase.rpc('mark_chat_conversation_read_atomic', {
          p_conversation_id: conversationId,
        });
      } else {
        await supabase
          .from('chat_participants')
          .update({ last_read_at: null })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUser.id);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTogglePin = async (conversationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const target = conversations.find((c) => c.id === conversationId);
      const willPin = !target?.isPinned;

      const currentlyPinnedCount = conversations.filter((c) => c.isPinned).length;
      if (willPin && currentlyPinnedCount >= 5) {
        Alert.alert('Pin Limit Reached', 'You can pin up to 5 conversations to the top of your inbox.');
        return;
      }

      setConversations((prev) =>
        sortConversations(
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, isPinned: willPin, pinnedAt: willPin ? new Date().toISOString() : null }
              : c
          )
        )
      );

      const { error } = await supabase.rpc('toggle_chat_conversation_pinned_atomic', {
        p_conversation_id: conversationId,
        p_pinned: willPin,
      });

      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Pin Error', e.message || 'Unable to update pin status.');
      fetchConversations();
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to remove this chat from your inbox?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            await supabase
              .from('chat_participants')
              .update({ removed_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUser.id);
          },
        },
      ]
    );
  };

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />

        {/* Edge-to-Edge Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStarredModalVisible(true);
                }}
                style={[
                  styles.starredBtn,
                  {
                    backgroundColor: isDark ? '#2a1a05' : '#fef3c7',
                    borderColor: isDark ? '#452608' : '#fde68a',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Starred messages"
                accessibilityHint="View all your starred favorite messages across all chats"
              >
                <Ionicons name="star" size={17} color="#f59e0b" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/compose' as any)}
                style={[styles.composeBtn, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="New message"
              >
                <Ionicons name="create-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: isDark ? '#1f1f1f' : '#e8edf3', borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.placeholder} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations, listings, or clients..."
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { color: colors.text }]}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.placeholder} />
              </TouchableOpacity>
            )}
          </View>

          {/* Segmentation Tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsList}>
              {(['all', 'leads', 'support', 'archived'] as InboxTab[]).map((tab) => {
                const isActive = activeTab === tab;
                const tabLabel =
                  tab === 'all'
                    ? 'All'
                    : tab === 'leads'
                    ? 'Leads'
                    : tab === 'support'
                    ? 'Support'
                    : 'Archived';
                return (
                  <ScalePressable
                    key={tab}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(tab);
                    }}
                    style={[
                      styles.tabItem,
                      isActive && {
                        backgroundColor: isDark ? '#3a0b18' : colors.primarySoft,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: isActive ? colors.primary : colors.placeholder },
                        isActive && { fontWeight: '700' },
                      ]}
                    >
                      {tabLabel}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>

            {/* Unread Toggle Pill */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setUnreadOnly((prev) => !prev);
              }}
              style={[
                styles.unreadFilterPill,
                unreadOnly && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.unreadFilterText,
                  { color: unreadOnly ? '#ffffff' : colors.placeholder },
                ]}
              >
                Unread
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Realtime Network Connectivity & Delta-Sync Banner */}
        <ConnectionBanner />

        {/* Conversation Feed */}
        {loading && conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={54} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Conversations Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
              {searchQuery
                ? 'No chats matched your search query.'
                : unreadOnly
                ? 'You have no unread messages.'
                : activeTab === 'archived'
                ? 'No archived conversations.'
                : 'Your inbox is clear. Start a new chat with the button above.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
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
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        )}

        {/* Long-Press Peek Action Sheet */}
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
        />

        {/* Global Starred Messages Viewer Modal */}
        <StarredMessagesModal
          visible={starredModalVisible}
          onClose={() => setStarredModalVisible(false)}
          conversationId={null}
          conversationTitle={null}
          onJumpToMessage={(msgId, convId) => {
            if (convId) {
              router.push(`/thread/${convId}`);
            }
          }}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.5,
  },
  starredBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    paddingVertical: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabsList: {
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
  unreadFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  unreadFilterText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
