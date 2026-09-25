import React from 'react';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ChatMessage } from '../MessageBubble';
import MessageActionModal from '../MessageActionModal';
import { ChatInfoModal } from '../ChatInfoModal';
import { MediaPreviewModal } from '../MediaPreviewModal';
import { MediaViewerModal } from '../MediaViewerModal';
import PropertyCatalogModal from '../PropertyCatalogModal';
import InquiryFormModal from '../InquiryFormModal';
import EmbedUrlModal from '../EmbedUrlModal';
import AskAIModal from '../AskAIModal';
import StarredMessagesModal from '../StarredMessagesModal';
import MuteDurationModal from '../MuteDurationModal';
import ThreadCrmModals from './ThreadCrmModals';
import { jumpToThreadMessage } from './threadJumpHelper';

export interface ThreadModalsHostProps {
  modals: any;
  session: any;
  messages: any;
  media: any;
  conversationId: string;
  flatListRef: React.RefObject<FlatList | null>;
  colors: any;
  isDark: boolean;
}

export function ThreadModalsHost({
  modals,
  session,
  messages,
  media,
  conversationId,
  flatListRef,
  colors,
  isDark,
}: ThreadModalsHostProps) {
  const router = useRouter();
  const canReport = Boolean(session.canReportAgent || session.conversation?.assignedAgent || session.conversation?.inquiryId);

  return (
    <>
      <MessageActionModal
        visible={modals.isActionVisible}
        message={modals.actionMessage}
        isCurrentUser={modals.actionMessage?.senderUserId === session.currentUser?.id}
        isStarred={modals.actionMessage ? messages.starredMsgIds.has(modals.actionMessage.id) : false}
        onClose={modals.closeModal}
        onReact={(emoji: string) => modals.actionMessage && messages.handleReactToMessage(modals.actionMessage.id, emoji)}
        onReply={(msg: ChatMessage) => messages.setReplyingToMessage(msg)}
        onStarToggle={(msgId: string) => messages.handleToggleStar(msgId)}
        onAskAI={(msg: ChatMessage) => modals.openAskAIModal(msg)}
        onDelete={(msgId: string) => messages.handleDeleteMessage(msgId)}
      />

      <ChatInfoModal
        visible={modals.isChatInfoVisible}
        conversation={session.conversation}
        messagesCount={messages.messages.length}
        onClose={modals.closeModal}
        onAddAsLead={() => modals.openModal('lead_capture')}
        onToggleArchive={session.handleToggleArchive}
        onViewStarred={() => modals.openModal('starred')}
        onReportAgent={canReport ? () => modals.openModal('report') : undefined}
      />

      <MediaPreviewModal
        visible={media.mediaPreviewVisible}
        assets={media.stagedMediaAssets}
        isSending={media.isUploadingMedia}
        onCancel={media.closeMediaPreview}
        onSend={media.handleSendStagedMedia}
      />

      <MediaViewerModal
        visible={media.mediaViewerVisible}
        mediaUrl={media.mediaViewerUrl}
        mediaKind={media.mediaViewerKind}
        onClose={media.closeMediaViewer}
      />

      <PropertyCatalogModal
        visible={modals.isCatalogVisible}
        onClose={modals.closeModal}
        onSelectListing={messages.handleSendCatalogListing}
      />

      <InquiryFormModal
        visible={modals.isInquiryFormVisible}
        onClose={modals.closeModal}
        onSelectTemplate={messages.handleSendInquiryTemplate}
      />

      <EmbedUrlModal
        visible={modals.isEmbedVisible}
        onClose={modals.closeModal}
        onSubmit={messages.handleSendEmbed}
      />

      <AskAIModal
        visible={modals.isAskAIVisible}
        message={modals.askAIMessage}
        onClose={modals.closeModal}
        onInsertToComposer={(text) => messages.setComposerText((prev: string) => (prev ? `${prev}\n${text}` : text))}
      />

      <StarredMessagesModal
        visible={modals.isStarredVisible}
        onClose={modals.closeModal}
        conversationId={conversationId}
        conversationTitle={session.conversation?.title || session.conversation?.partnerName || 'Chat'}
        onUnstarMessage={(msgId) => messages.handleToggleStar(msgId)}
        onJumpToMessage={(msgId, convId) => jumpToThreadMessage(msgId, convId, conversationId, messages.messages, flatListRef, router)}
      />

      <ThreadCrmModals
        modals={modals}
        session={session}
        messages={messages}
        conversationId={conversationId}
        colors={colors}
        isDark={isDark}
      />

      <MuteDurationModal
        visible={session.isMuteModalVisible}
        onClose={session.closeMuteModal}
        onSelect={session.handleMuteWithDuration}
      />
    </>
  );
}

export default ThreadModalsHost;
