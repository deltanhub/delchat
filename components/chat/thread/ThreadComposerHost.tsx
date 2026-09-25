import React, { useCallback } from 'react';
import ChatComposer, { ChatAttachmentActionType } from '../ChatComposer';
import { ThreadBlockedOrPrivateComposerBar } from './ThreadBlockedOrPrivateComposerBar';
import { ThreadRateLimitBanner } from './ThreadRateLimitBanner';

export interface ThreadComposerHostProps {
  session: any;
  messages: any;
  media: any;
  modals: any;
  isPrivateAgentChat: boolean;
  assignedAgentName: string;
  isDark: boolean;
  handleComposerTextChange: (text: string) => void;
}

export function ThreadComposerHost({
  session,
  messages,
  media,
  modals,
  isPrivateAgentChat,
  assignedAgentName,
  isDark,
  handleComposerTextChange,
}: ThreadComposerHostProps) {
  const handleSelectAttachment = useCallback(async (type: ChatAttachmentActionType) => {
    if (type === 'media') await media.handlePickMedia();
    else if (type === 'photo') await media.handleLaunchCamera();
    else if (type === 'document') await media.handlePickDocument();
    else if (type === 'catalog') modals.openModal('catalog');
    else if (type === 'form') modals.openModal('inquiry_form');
    else if (type === 'embed') modals.openModal('embed');
    else if (type === 'lead') await session.handleConvertToLead();
    else if (type === 'assign-agent') modals.openModal('assignment');
  }, [media, modals, session]);

  return (
    <>
      <ThreadRateLimitBanner visible={Boolean(messages.rateLimitCooldown)} />
      {session.conversation?.isBlocked || isPrivateAgentChat ? (
        <ThreadBlockedOrPrivateComposerBar
          isBlocked={Boolean(session.conversation?.isBlocked)}
          blockedByMe={Boolean(session.conversation?.blockedByMe)}
          isPrivateAgentChat={Boolean(isPrivateAgentChat)}
          assignedAgentName={assignedAgentName}
          isDark={isDark}
        />
      ) : (
        <ChatComposer
          value={messages.composerText}
          onChangeText={(text) => {
            messages.setComposerText(text);
            handleComposerTextChange(text);
          }}
          onSend={messages.handleSendMessage}
          onSendVoiceNote={media.handleSendVoiceNote}
          onSelectAttachment={handleSelectAttachment}
          replyingToMessage={
            messages.replyingToMessage
              ? {
                  id: messages.replyingToMessage.id,
                  authorName: messages.replyingToMessage.authorName,
                  body: messages.replyingToMessage.body,
                }
              : null
          }
          onCancelReply={() => messages.setReplyingToMessage(null)}
        />
      )}
    </>
  );
}
