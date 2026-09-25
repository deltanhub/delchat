import React from 'react';
import Animated, { SlideInDown } from 'react-native-reanimated';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { ConversationContextMenuProps } from './types';
import ConversationContextMenuItem from './ConversationContextMenuItem';

export function ConversationContextMenu({
  conversation,
  onClose,
  onToggleArchive,
  onToggleMute,
  onMarkReadToggle,
  onDeleteConversation,
  onClearConversation,
  onBlockUser,
  onTogglePin,
  onToggleFavorite,
}: ConversationContextMenuProps) {
  const isArchived = Boolean(conversation.isArchived);
  const isMuted = Boolean(conversation.isMuted);
  const isUnread = conversation.unreadCount > 0;
  const isBlocked = Boolean(conversation.isBlocked);

  return (
    <Animated.View
      entering={SlideInDown.duration(220).springify()}
      style={styles.contextMenuCard}
    >
      {/* 0. Pin / Unpin */}
      {onTogglePin && (
        <ConversationContextMenuItem
          label={conversation.isPinned ? 'Unpin from Top' : 'Pin to Top (Max 5)'}
          iconName={conversation.isPinned ? 'pin' : 'pin-outline'}
          iconColor={conversation.isPinned ? '#ff9500' : '#8e8e93'}
          onPress={() => {
            onClose();
            onTogglePin(conversation.id);
          }}
        />
      )}

      {/* 1. Mark as unread / read */}
      <ConversationContextMenuItem
        label={isUnread ? 'Mark as read' : 'Mark as unread'}
        iconName={isUnread ? 'checkmark-done' : 'chatbubble-ellipses-outline'}
        iconColor={isUnread ? '#34c759' : '#8e8e93'}
        onPress={() => {
          onClose();
          onMarkReadToggle(conversation.id, isUnread);
        }}
      />

      {/* 2. Archive */}
      <ConversationContextMenuItem
        label={isArchived ? 'Unarchive' : 'Archive'}
        iconName="archive-outline"
        onPress={() => {
          onClose();
          onToggleArchive(conversation.id, isArchived);
        }}
      />

      {/* 3. Mute */}
      <ConversationContextMenuItem
        label={isMuted ? 'Unmute' : 'Mute'}
        iconName={isMuted ? 'volume-high-outline' : 'notifications-off-outline'}
        onPress={() => {
          onClose();
          onToggleMute(conversation.id, isMuted);
        }}
      />

      {/* 4. Add / Remove from Favourites */}
      <ConversationContextMenuItem
        label={conversation.isFavorited ? 'Remove from Favourites' : 'Add to Favourites'}
        iconName={conversation.isFavorited ? 'heart' : 'heart-outline'}
        iconColor={conversation.isFavorited ? '#ff2d55' : '#8e8e93'}
        onPress={() => {
          onClose();
          onToggleFavorite?.(conversation.id, Boolean(conversation.isFavorited));
        }}
      />

      {/* 5. Block / Unblock user */}
      {onBlockUser && (
        <ConversationContextMenuItem
          label={isBlocked ? `Unblock ${conversation.partnerName}` : `Block ${conversation.partnerName}`}
          iconName="ban-outline"
          onPress={() => {
            onClose();
            onBlockUser(conversation);
          }}
        />
      )}

      {/* 6. Clear chat */}
      {onClearConversation && (
        <ConversationContextMenuItem
          label="Clear chat"
          iconName="close-circle-outline"
          onPress={() => {
            onClose();
            onClearConversation(conversation.id);
          }}
        />
      )}

      {/* 7. Delete chat (Destructive Red) - uses destructiveText */}
      <ConversationContextMenuItem
        label="Delete chat"
        iconName="trash-outline"
        iconColor="#ff453a"
        isLast
        isDestructive
        hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
        onPress={() => {
          onClose();
          onDeleteConversation(conversation.id);
        }}
      />
    </Animated.View>
  );
}

export default ConversationContextMenu;
