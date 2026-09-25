import React from 'react';
import ConversationActionModal from '../chat/ConversationActionModal';
import MuteDurationModal from '../chat/MuteDurationModal';
import { ArchivedModalsHostProps } from './types';

export function ArchivedModalsHost({
  actionModalVisible,
  actionModalConv,
  currentUserId,
  onCloseActionModal,
  onOpenConversation,
  onToggleArchive,
  onToggleMute,
  onMarkReadToggle,
  onTogglePin,
  onDeleteConversation,
  onClearConversation,
  onBlockUser,
  onToggleFavorite,
  muteModalVisible,
  onCloseMuteModal,
  onSelectMuteDuration,
}: ArchivedModalsHostProps) {
  return (
    <>
      {/* Long-Press Action Modal */}
      <ConversationActionModal
        visible={actionModalVisible}
        conversation={actionModalConv}
        currentUserId={currentUserId}
        onClose={onCloseActionModal}
        onOpenConversation={onOpenConversation}
        onToggleArchive={onToggleArchive}
        onToggleMute={onToggleMute}
        onMarkReadToggle={onMarkReadToggle}
        onTogglePin={onTogglePin}
        onDeleteConversation={onDeleteConversation}
        onClearConversation={onClearConversation}
        onBlockUser={onBlockUser}
        onToggleFavorite={onToggleFavorite}
      />

      {/* WhatsApp/Telegram-Style Mute Duration Picker */}
      <MuteDurationModal
        visible={muteModalVisible}
        onClose={onCloseMuteModal}
        onSelect={onSelectMuteDuration}
      />
    </>
  );
}

export default ArchivedModalsHost;
