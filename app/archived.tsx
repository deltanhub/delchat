import React from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';
import ConversationRow from '../components/chat/ConversationRow';
import {
  styles,
  ArchivedHeader,
  ArchivedSearchBar,
  ArchivedEmptyState,
  ArchivedInfoBanner,
  ArchivedModalsHost,
  useArchivedData,
  useArchivedActions,
} from '../components/archived';

export default function ArchivedChatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    conversations,
    setConversations,
    archivedConversations,
    loading,
    refreshing,
    currentUser,
    searchQuery,
    setSearchQuery,
    fetchConversations,
    onRefresh,
  } = useArchivedData();

  const {
    actionModalVisible,
    actionModalConv,
    openActionModal,
    closeActionModal,
    muteModalVisible,
    closeMuteModal,
    handleOpenConversation,
    handleToggleArchive,
    handleToggleMute,
    handleArchivedMuteWithDuration,
    handleMarkReadToggle,
    handleTogglePin,
    handleDeleteConversation,
    handleToggleFavorite,
    handleClearConversation,
    handleBlockUser,
  } = useArchivedActions({
    conversations,
    setConversations,
    currentUser,
    fetchConversations,
  });

  const accentColor = isDark ? '#f4a5b8' : colors.primary;

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <ArchivedHeader
          insets={insets}
          accentColor={accentColor}
          colors={colors}
          isDark={isDark}
          onBack={() => router.back()}
        />

        <ArchivedSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          colors={colors}
          isDark={isDark}
        />

        {loading && conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : archivedConversations.length === 0 ? (
          <ArchivedEmptyState
            searchQuery={searchQuery}
            colors={colors}
          />
        ) : (
          <FlatList
            data={archivedConversations}
            keyExtractor={(item) => item.id}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={11}
            removeClippedSubviews={Platform.OS === 'android'}
            ListHeaderComponent={<ArchivedInfoBanner colors={colors} isDark={isDark} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                isActive={false}
                onSelect={handleOpenConversation}
                onLongPress={openActionModal}
              />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          />
        )}

        <ArchivedModalsHost
          actionModalVisible={actionModalVisible}
          actionModalConv={actionModalConv}
          currentUserId={currentUser?.id}
          onCloseActionModal={closeActionModal}
          onOpenConversation={handleOpenConversation}
          onToggleArchive={handleToggleArchive}
          onToggleMute={handleToggleMute}
          onMarkReadToggle={handleMarkReadToggle}
          onTogglePin={handleTogglePin}
          onDeleteConversation={handleDeleteConversation}
          onClearConversation={handleClearConversation}
          onBlockUser={handleBlockUser}
          onToggleFavorite={handleToggleFavorite}
          muteModalVisible={muteModalVisible}
          onCloseMuteModal={closeMuteModal}
          onSelectMuteDuration={handleArchivedMuteWithDuration}
        />
      </View>
    </AnimatedPageWrapper>
  );
}
