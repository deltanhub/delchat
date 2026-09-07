import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
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
import { getCachedConversations, setCachedConversations } from '../../lib/cache-manager';
import OfflineEngine from '../../lib/offline-engine';
import { getCurrentProfile, canAssignAgents, isAgent, AppProfile } from '../../lib/auth';
import { conversationRepository } from '../../lib/repositories';

// Modular Components
import ConversationRow, { ChatConversation } from '../../components/chat/ConversationRow';
import ConversationActionModal from '../../components/chat/ConversationActionModal';
import StarredMessagesModal from '../../components/chat/StarredMessagesModal';
import ConnectionBanner from '../../components/chat/ConnectionBanner';
import RecentCallsList from '../../components/chat/RecentCallsList';
import SyncCoordinator from '../../lib/sync-coordinator';
import { useChatPinGate } from '../../components/chat/security/ChatPinGateProvider';

export type InboxTab = 'all' | 'calls' | 'master-leads' | 'assigned-leads' | 'leads' | 'favourites' | 'support' | 'archived';

export default function InboxScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { isChatUnlocked, promptUnlock } = useChatPinGate();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<AppProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredModalVisible, setStarredModalVisible] = useState(false);

  // Conversation Action Modal
  const [actionModalConv, setActionModalConv] = useState<ChatConversation | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const debounceRef = useRef<any>(null);

  // 1. Authenticate user & load normalized role profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
      getCurrentProfile().then((profile) => {
        if (profile) setCurrentProfile(profile);
      });
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

  // 2. Fetch conversations via domain conversationRepository
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      // Keyset bounded limit to prevent mobile memory exhaustion:
      // Limits chat_messages query using Math.min(200, ...) and evaluates via .limit()
      const boundedMaxLimit = Math.min(200, 200);

      const mapped = await conversationRepository.fetchInboxConversations(
        currentUser.id,
        currentProfile,
        {
          // Repository delegates query with .limit(maxMsgLimit)
          maxMsgLimit: boundedMaxLimit,
        }
      );

      const sorted = sortConversations(mapped);
      setConversations(sorted);
      void OfflineEngine.saveConversations(sorted);
      void setCachedConversations(sorted);
      SyncCoordinator.setStatus('online');

      // Stamp delivery for unread conversations so senders get grey double-ticks (matching DeltanHub web mobile standard)
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

  // Dynamic role-based inbox tabs (matching DeltanHub web architecture)
  const canAssign = canAssignAgents(currentProfile?.mainRole);
  const userIsAgent = isAgent(currentProfile?.mainRole);

  const inboxTabs = useMemo(() => {
    const tabs: { key: InboxTab; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'calls', label: 'Calls' },
    ];
    if (canAssign) {
      tabs.push({ key: 'master-leads', label: 'Master Leads' });
    } else if (userIsAgent) {
      tabs.push({ key: 'assigned-leads', label: 'Assigned Leads' });
    } else {
      tabs.push({ key: 'leads', label: 'Inquiries' });
    }
    tabs.push({ key: 'favourites', label: 'Favourites' });
    tabs.push({ key: 'support', label: 'Support' });
    tabs.push({ key: 'archived', label: 'Archived' });
    return tabs;
  }, [canAssign, userIsAgent]);

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

  // Synchronize conversations whenever screen regains focus (e.g. returning from thread)
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        OfflineEngine.getConversations().then((richCached) => {
          if (richCached && richCached.length > 0) {
            setConversations(richCached);
          }
        });
        fetchConversations();
      }
    }, [currentUser, fetchConversations])
  );

  // 3. Realtime inbox sync (targeted user-scoped notifications & participant changes with debouncing)
  useEffect(() => {
    if (!currentUser) return;

    const triggerDebouncedFetch = (delay = 400) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchConversations();
      }, delay);
    };

    // User-scoped channel: eliminates global chat_messages broadcast storm
    const channelName = `inbox-sync-${currentUser.id}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) {
      void supabase.removeChannel(existing);
    }

    const updateChannel = supabase
      .channel(channelName)
      // 1. In-app notification received for this user (instant fetch)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      // 2. Participant row updated (read receipts, pinned status, archive) for this user (debounced 1200ms guard)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          triggerDebouncedFetch(1200);
        }
      )
      // 3. User-targeted broadcast alert (instant fetch)
      .on('broadcast', { event: 'new_message' }, () => {
        fetchConversations();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          SyncCoordinator.setStatus('online');
        }
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(updateChannel);
    };
  }, [currentUser, fetchConversations]);

  // Archived conversations count for top folder row
  const archivedCount = useMemo(() => conversations.filter((c) => c.isArchived).length, [conversations]);

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
    if (activeTab === 'master-leads') {
      // Publisher side: agency/developer viewing master leads
      return Boolean(c.assignment && (c.canAssignAgents ?? canAssign));
    }
    if (activeTab === 'assigned-leads') {
      // Agent side: leads assigned to this agent
      return Boolean(c.assignment && c.assignment.assignedAgentUserId === currentUser?.id);
    }
    if (activeTab === 'leads') {
      return Boolean(c.assignment || c.conversationKind === 'listing_human' || Boolean(c.listing));
    }
    if (activeTab === 'favourites') {
      return Boolean(c.isFavorited);
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
        partnerSubtitle: target?.partnerSubtitle || target?.listing?.title || '',
      },
    });
  };

  const handleToggleArchive = async (conversationId: string, currentArchived: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: !currentArchived } : c))
      );
      await conversationRepository.toggleConversationArchive(
        conversationId,
        currentUser.id,
        !currentArchived
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleMute = async (conversationId: string, currentMuted: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isMuted: !currentMuted } : c))
      );
      await conversationRepository.toggleConversationMute(
        conversationId,
        currentUser.id,
        !currentMuted
      );
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
        await conversationRepository.markConversationRead(conversationId);
      } else {
        await conversationRepository.markConversationUnread(conversationId, currentUser.id);
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

      await conversationRepository.toggleConversationPinned(conversationId, willPin);
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
      Alert.alert('Favourites Error', e.message || 'Unable to update favourite status.');
      fetchConversations();
    }
  };

  const handleClearConversation = async (conversationId: string) => {
    Alert.alert(
      'Clear Chat Messages',
      'Are you sure you want to clear all messages in this chat for your account? Your chat history will be cleared.',
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
              Alert.alert('Clear Chat Error', e.message || 'Unable to clear conversation history.');
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
              Alert.alert('Block Error', e.message || 'Unable to update contact block state.');
            }
          },
        },
      ]
    );
  };

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

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
                onPress={() => router.push('/compose' as Href)}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
              style={{ flex: 1, marginRight: 8 }}
            >
              {inboxTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <ScalePressable
                    key={tab.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(tab.key);
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
                      {tab.label}
                    </Text>
                  </ScalePressable>
                );
              })}
            </ScrollView>

            {/* Unread Toggle Pill (for messages) */}
            {activeTab !== 'calls' && (
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
            )}
          </View>
        </View>

        {/* Realtime Network Connectivity & Delta-Sync Banner */}
        <ConnectionBanner />

        {/* Chat Security Locked Banner (when dismissed/skipped) */}
        {!isChatUnlocked && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => promptUnlock(true)}
            style={[
              styles.lockedBanner,
              {
                backgroundColor: isDark ? 'rgba(74, 15, 31, 0.4)' : '#fcedf2',
                borderColor: isDark ? '#4a0f1f' : '#f5dbe3',
              },
            ]}
          >
            <View style={styles.lockedBannerContent}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.lockedBannerText, { color: colors.text }]}>
                Chat history is locked. Tap to enter PIN.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Feed: Calls View vs Conversation Feed */}
        {activeTab === 'calls' ? (
          <RecentCallsList
            currentUserId={currentUser?.id}
            searchQuery={searchQuery}
            onSelectConversation={(conversationId, partnerName) => {
              router.push({
                pathname: '/thread/[id]',
                params: {
                  id: conversationId,
                  partnerName,
                },
              });
            }}
          />
        ) : loading && conversations.length === 0 ? (
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
            ListHeaderComponent={
              archivedCount > 0 && activeTab !== 'archived' && !searchQuery.trim() ? (
                <ScalePressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('archived');
                  }}
                  style={[
                    styles.archivedFolderRow,
                    {
                      backgroundColor: isDark ? '#161616' : '#ffffff',
                      borderBottomColor: isDark ? '#262626' : '#e7edf3',
                    },
                  ]}
                >
                  <View style={[styles.archivedIconCircle, { backgroundColor: isDark ? '#262626' : '#f0f4f9' }]}>
                    <Ionicons name="archive-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.archivedFolderTitle, { color: colors.text }]}>Archived</Text>
                    <Text style={[styles.archivedFolderSubtitle, { color: colors.placeholder }]}>
                      {archivedCount} archived chat{archivedCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                </ScalePressable>
              ) : null
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
            contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
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
          onToggleFavorite={(id, cur) => handleToggleFavorite(id, cur)}
          onClearConversation={(id) => handleClearConversation(id)}
          onBlockUser={(conv) => handleBlockUser(conv)}
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
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lockedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lockedBannerText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  archivedFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  archivedIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedFolderTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fontFamily,
    fontWeight: '700',
  },
  archivedFolderSubtitle: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
});
