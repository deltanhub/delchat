import React from 'react';
import {
  ChatMessage,
  ChatAttachmentItem,
  MessageBubbleProps,
  detectPaymentRequest,
  formatMsgTime,
  getStaffTag,
  WAVEFORM_BAR_HEIGHTS,
  ActiveAudioSession,
  registerAudioPlayback,
  stopAudioPlayback,
} from './bubbles/types';

import AgentCardBubble, { parseAssignedAgentCard } from './bubbles/AgentCardBubble';
import SystemMessageBubble from './bubbles/SystemMessageBubble';
import ListingCardBubble from './bubbles/ListingCardBubble';
import InquiryFormBubble from './bubbles/InquiryFormBubble';
import InquiryResponseBubble from './bubbles/InquiryResponseBubble';
import BroadcastBubble from './bubbles/BroadcastBubble';
import EmbedBubble from './bubbles/EmbedBubble';
import LeadCardBubble from './bubbles/LeadCardBubble';
import VoiceNoteBubble from './bubbles/VoiceNoteBubble';
import TextMessageBubble from './bubbles/TextMessageBubble';

// Re-export shared interfaces & utility functions for backward compatibility
export type { ChatMessage, ChatAttachmentItem, MessageBubbleProps, ActiveAudioSession };
export {
  detectPaymentRequest,
  formatMsgTime,
  getStaffTag,
  WAVEFORM_BAR_HEIGHTS,
  registerAudioPlayback,
  stopAudioPlayback,
};

/**
 * Polymorphic Message Bubble Dispatcher
 * Dispatches to single-responsibility sub-renderers based on message kind and payload.
 */
export default function MessageBubble({
  message,
  isCurrentUser,
  isStarred = false,
  onSendInquiryResponse,
  onReactToMessage,
  onPressMedia,
  onLongPressMessage,
}: MessageBubbleProps) {
  // Never render confidential brokerage internal notes in client feeds
  if (message.intent === 'internal_note' || message.structuredPayload?.isInternalOnly) {
    return null;
  }

  // 1. Assigned Agent Card
  const assignedAgentCard = parseAssignedAgentCard(message);
  if (assignedAgentCard) {
    return (
      <AgentCardBubble
        card={assignedAgentCard}
        message={message}
        isStarred={isStarred}
      />
    );
  }

  // 2. System Notice
  if (message.messageKind === 'system' || message.senderType === 'system') {
    return <SystemMessageBubble message={message} isCurrentUser={isCurrentUser} />;
  }

  // 3. Real Estate Property Listing Card
  if (message.messageKind === 'listing_card' && message.listingCard) {
    return (
      <ListingCardBubble
        message={message}
        isCurrentUser={isCurrentUser}
        isStarred={isStarred}
      />
    );
  }

  // 4. Interactive Inquiry Form
  if (message.messageKind === 'inquiry_form' && message.inquiryFormCard) {
    return (
      <InquiryFormBubble
        message={message}
        isCurrentUser={isCurrentUser}
        onSendInquiryResponse={onSendInquiryResponse}
      />
    );
  }

  // 5. Submitted Inquiry Response Summary
  if (message.messageKind === 'inquiry_response' && message.inquiryResponseCard) {
    return (
      <InquiryResponseBubble
        message={message}
        isCurrentUser={isCurrentUser}
      />
    );
  }

  // 6. Marketing Broadcast Announcement
  if (
    message.messageKind === 'broadcast' ||
    message.structuredPayload?.is_broadcast
  ) {
    return (
      <BroadcastBubble
        message={message}
        onPressMedia={onPressMedia}
      />
    );
  }

  // 7. 3D Virtual Tour / Embed
  if (
    message.messageKind === 'embed' ||
    message.structuredPayload?.card_kind === 'embed' ||
    message.structuredPayload?.embed
  ) {
    return (
      <EmbedBubble
        message={message}
        isCurrentUser={isCurrentUser}
        isStarred={isStarred}
      />
    );
  }

  // 8. Captured CRM Lead Card
  if (
    message.messageKind === 'lead' ||
    message.structuredPayload?.card_kind === 'lead' ||
    message.structuredPayload?.lead
  ) {
    return (
      <LeadCardBubble
        message={message}
        isCurrentUser={isCurrentUser}
        isStarred={isStarred}
      />
    );
  }

  // 9. Voice Note Audio Player
  if (message.messageKind === 'voice_note' || message.structuredPayload?.voiceNote) {
    return (
      <VoiceNoteBubble
        message={message}
        isCurrentUser={isCurrentUser}
        isStarred={isStarred}
        onLongPressMessage={onLongPressMessage}
        onReactToMessage={onReactToMessage}
      />
    );
  }

  // 10. Default Standard Text & Attachment Message Bubble
  return (
    <TextMessageBubble
      message={message}
      isCurrentUser={isCurrentUser}
      isStarred={isStarred}
      onPressMedia={onPressMedia}
      onLongPressMessage={onLongPressMessage}
      onReactToMessage={onReactToMessage}
    />
  );
}
