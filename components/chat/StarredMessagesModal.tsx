import React from 'react';
import { Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { useStarredMessages } from '../../hooks/useStarredMessages';
import {
  StarredMessagesHeader,
  StarredMessagesScopeTabs,
  StarredMessagesSearchBar,
  StarredMessageCard,
  StarredMessagesEmptyState,
  StarredMessagesModalProps,
  StarredMessageItem,
} from './starred';
import { modalStyles } from './starred/modalStyles';

export { StarredMessageItem, StarredMessagesModalProps };

export default function StarredMessagesModal({
  visible,
  onClose,
  conversationId,
  onJumpToMessage,
  onUnstarMessage,
}: StarredMessagesModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    scope,
    setScope,
    loading,
    searchQuery,
    setSearchQuery,
    error,
    filteredMessages,
    fetchStarredMessages,
    handleUnstar,
  } = useStarredMessages({
    visible,
    conversationId,
    onUnstarMessage,
  });

  if (!visible) return null;

  const showEmptyState = loading || error !== null || filteredMessages.length === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            modalStyles.container,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <StarredMessagesHeader
            isDark={isDark}
            colors={colors}
            onClose={onClose}
          />

          {/* Scope Selector (if conversationId provided) */}
          {conversationId && (
            <StarredMessagesScopeTabs
              scope={scope}
              onSelectScope={setScope}
              isDark={isDark}
              colors={colors}
            />
          )}

          {/* Search Box */}
          <StarredMessagesSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isDark={isDark}
            colors={colors}
          />

          {/* Body Content */}
          {showEmptyState ? (
            <StarredMessagesEmptyState
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              scope={scope}
              isDark={isDark}
              colors={colors}
              onRetry={fetchStarredMessages}
            />
          ) : (
            <FlatList
              data={filteredMessages}
              keyExtractor={(item) => item.starredId}
              contentContainerStyle={modalStyles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <StarredMessageCard
                  item={item}
                  scope={scope}
                  isDark={isDark}
                  colors={colors}
                  onUnstar={handleUnstar}
                  onJumpToMessage={onJumpToMessage}
                  onClose={onClose}
                />
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
