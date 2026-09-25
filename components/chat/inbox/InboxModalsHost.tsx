import React from 'react';
import { useRouter } from 'expo-router';
import ConversationActionModal from '../ConversationActionModal';
import StarredMessagesModal from '../StarredMessagesModal';
import MuteDurationModal from '../MuteDurationModal';

export interface InboxModalsHostProps {
  actionModalVisible: boolean;
  setActionModalVisible: (visible: boolean) => void;
  actionModalConv: any;
  currentUserId?: string;
  starredModalVisible: boolean;
  setStarredModalVisible: (visible: boolean) => void;
  muteModalVisible: boolean;
  setMuteModalVisible: (visible: boolean) => void;
  setMuteTargetId: (id: string | null) => void;
  onOpenConversation: (conversationId: string) => void;
  onToggleArchive: (conversationId: string, currentArchived: boolean) => void;
  onToggleMute: (conversationId: string, currentMuted: boolean) => void;
  onMarkReadToggle: (conversationId: string, currentUnread: boolean) => void;
  onTogglePin: (conversationId: string) => void;
  onToggleFavorite: (conversationId: string, currentFavorited: boolean) => void;
  onClearConversation: (conversationId: string) => void;
  onBlockUser: (conversation: any) => void;
  onDeleteConversation: (conversationId: string) => void;
  onSelectMuteDuration: (duration: any) => void;
}

export default function InboxModalsHost({
  actionModalVisible,
  setActionModalVisible,
  actionModalConv,
  currentUserId,
  starredModalVisible,
  setStarredModalVisible,
  muteModalVisible,
  setMuteModalVisible,
  setMuteTargetId,
  onOpenConversation,
  onToggleArchive,
  onToggleMute,
  onMarkReadToggle,
  onTogglePin,
  onToggleFavorite,
  onClearConversation,
  onBlockUser,
  onDeleteConversation,
  onSelectMuteDuration,
}: InboxModalsHostProps) {
  const router = useRouter();

  return (
    <>
      {/* Long-Press Peek Action Sheet */}
      <ConversationActionModal
        visible={actionModalVisible}
        conversation={actionModalConv}
        currentUserId={currentUserId}
        onClose={() => setActionModalVisible(false)}
        onOpenConversation={onOpenConversation}
        onToggleArchive={onToggleArchive}
        onToggleMute={onToggleMute}
        onMarkReadToggle={onMarkReadToggle}
        onTogglePin={onTogglePin}
        onToggleFavorite={onToggleFavorite}
        onClearConversation={onClearConversation}
        onBlockUser={onBlockUser}
        onDeleteConversation={onDeleteConversation}
      />

      {/* Global Starred Messages Viewer Modal */}
      <StarredMessagesModal
        visible={starredModalVisible}
        onClose={() => setStarredModalVisible(false)}
        conversationId={null}
        conversationTitle={null}
        onJumpToMessage={(_msgId, convId) => {
          if (convId) router.push(`/thread/${convId}`);
        }}
      />

      {/* WhatsApp/Telegram-Style Mute Duration Picker */}
      <MuteDurationModal
        visible={muteModalVisible}
        onClose={() => {
          setMuteModalVisible(false);
          setMuteTargetId(null);
        }}
        onSelect={onSelectMuteDuration}
      />
    </>
  );
}
