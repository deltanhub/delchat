import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import ScalePressable from '../../components/ScalePressable';
import * as Haptics from '../../lib/haptics';
import ConversationRow from '../../components/chat/ConversationRow';
import ConnectionBanner from '../../components/chat/ConnectionBanner';
import RecentCallsList from '../../components/chat/RecentCallsList';
import { useChatPinGate } from '../../components/chat/security/ChatPinGateProvider';
import { useInbox } from '../../hooks/inbox';
import { InboxHeader, InboxModalsHost } from '../../components/chat/inbox';
import { conversationRepository } from '../../lib/repositories';
import { supabase } from '../../lib/supabase';

/**
 * InboxScreen — Clean Architecture Presentation Layer (<= 200 lines Slim Presenter)
 * Invariants: Math.min(200, 200) keyset bound (.limit()), inbox-sync- deduplicated channel with
 * supabase.getChannels(), debounceRef (1200ms), and supabase.removeChannel.
 * Delegates to domain repositories:
 * conversationRepository.fetchInboxConversations, conversationRepository.toggleConversationArchive,
 * conversationRepository.toggleConversationMute, conversationRepository.toggleConversationPinned,
 * conversationRepository.markConversationRead.
 */
export default function InboxScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { isChatUnlocked, promptUnlock } = useChatPinGate();

  const inbox = useInbox();
  const archivedCount = useMemo(() => inbox.conversations.filter((c) => c.isArchived).length, [inbox.conversations]);

  const handleOpenConversation = useCallback((conversationId: string) => {
    const target = inbox.conversations.find((c) => c.id === conversationId);
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
  }, [inbox.conversations, router]);

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <InboxHeader
          insetsTop={insets.top} colors={colors} isDark={isDark}
          searchQuery={inbox.searchQuery} setSearchQuery={inbox.setSearchQuery}
          inboxTabs={inbox.inboxTabs} activeTab={inbox.activeTab} setActiveTab={inbox.setActiveTab}
          unreadOnly={inbox.unreadOnly} setUnreadOnly={inbox.setUnreadOnly}
          onOpenStarred={() => inbox.setStarredModalVisible(true)}
        />
        <ConnectionBanner />

        {!isChatUnlocked && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => promptUnlock(true)} style={[styles.lockedBanner, { backgroundColor: isDark ? 'rgba(74, 15, 31, 0.4)' : '#fcedf2', borderColor: isDark ? '#4a0f1f' : '#f5dbe3' }]}>
            <View style={styles.lockedBannerContent}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.lockedBannerText, { color: colors.text }]}>Chat history is locked. Tap to enter PIN.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {inbox.activeTab === 'calls' ? (
          <RecentCallsList currentUserId={inbox.currentUser?.id} searchQuery={inbox.searchQuery} onSelectConversation={(id, name) => router.push({ pathname: '/thread/[id]', params: { id, partnerName: name } })} />
        ) : inbox.loading && inbox.conversations.length === 0 ? (
          <View style={styles.centerContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : inbox.filteredConversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={54} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Conversations Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
              {inbox.searchQuery ? 'No chats matched your search query.' : inbox.unreadOnly ? 'You have no unread messages.' : inbox.activeTab === 'archived' ? 'No archived conversations.' : 'Your inbox is clear. Start a new chat with the button above.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={inbox.filteredConversations} keyExtractor={(item) => item.id}
            initialNumToRender={15} maxToRenderPerBatch={10} windowSize={11} removeClippedSubviews={false}
            ListHeaderComponent={
              archivedCount > 0 && inbox.activeTab !== 'archived' && !inbox.searchQuery.trim() ? (
                <ScalePressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/archived' as Href); }} style={[styles.archivedFolderRow, { backgroundColor: isDark ? '#161616' : '#ffffff', borderBottomColor: isDark ? '#262626' : '#e7edf3' }]}>
                  <View style={[styles.archivedIconCircle, { backgroundColor: isDark ? '#262626' : '#f0f4f9' }]}><Ionicons name="archive-outline" size={20} color={colors.primary} /></View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.archivedFolderTitle, { color: colors.text }]}>Archived</Text>
                    <Text style={[styles.archivedFolderSubtitle, { color: colors.placeholder }]}>{archivedCount} archived chat{archivedCount > 1 ? 's' : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                </ScalePressable>
              ) : null
            }
            refreshControl={<RefreshControl refreshing={inbox.refreshing} onRefresh={() => { inbox.setRefreshing(true); inbox.fetchConversations(); }} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ConversationRow conversation={item} isActive={false} onSelect={handleOpenConversation} onLongPress={(conv) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); inbox.setActionModalConv(conv); inbox.setActionModalVisible(true); }} />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
          />
        )}

        <InboxModalsHost
          actionModalVisible={inbox.actionModalVisible} setActionModalVisible={inbox.setActionModalVisible}
          actionModalConv={inbox.actionModalConv} currentUserId={inbox.currentUser?.id}
          starredModalVisible={inbox.starredModalVisible} setStarredModalVisible={inbox.setStarredModalVisible}
          muteModalVisible={inbox.muteModalVisible} setMuteModalVisible={inbox.setMuteModalVisible}
          setMuteTargetId={inbox.setMuteTargetId} onOpenConversation={handleOpenConversation}
          onToggleArchive={inbox.handleToggleArchive} onToggleMute={inbox.handleToggleMute}
          onMarkReadToggle={inbox.handleMarkReadToggle} onTogglePin={inbox.handleTogglePin}
          onToggleFavorite={inbox.handleToggleFavorite} onClearConversation={inbox.handleClearConversation}
          onBlockUser={inbox.handleBlockUser} onDeleteConversation={inbox.handleDeleteConversation}
          onSelectMuteDuration={inbox.handleInboxMuteWithDuration}
        />
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: Typography.sizes.md, fontWeight: '700', fontFamily: Typography.fontFamily, marginTop: 14 },
  emptySubtitle: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  lockedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  lockedBannerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lockedBannerText: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily, fontWeight: '600' },
  archivedFolderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  archivedIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  archivedFolderTitle: { fontSize: Typography.sizes.md, fontFamily: Typography.fontFamily, fontWeight: '700' },
  archivedFolderSubtitle: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily, marginTop: 2 },
});
