import {
  FetchMessagesParams,
  FetchMessagesResult,
  SendTextMessageParams,
  SendVoiceNoteMessageParams,
  SendDocumentMessageParams,
  SendListingMessageParams,
  SendEmbedMessageParams,
  SendInquiryTemplateParams,
  SendInquiryResponseParams,
  fetchThreadMessages,
  toggleMessageStar,
  toggleMessageReaction,
  deleteMessage,
  markConversationRead,
  markConversationDelivered,
  sendTextMessage,
  sendVoiceNoteMessage,
  sendDocumentMessage,
  sendListingMessage,
  sendEmbedMessage,
  sendInquiryTemplate,
  sendInquiryResponse,
} from './message';

export type {
  DbMessageRow,
  FetchMessagesParams,
  FetchMessagesResult,
  SendTextMessageParams,
  SendVoiceNoteMessageParams,
  SendDocumentMessageParams,
  SendListingMessageParams,
  SendEmbedMessageParams,
  SendInquiryTemplateParams,
  SendInquiryResponseParams,
} from './message';

export {
  fetchThreadMessages,
  toggleMessageStar,
  toggleMessageReaction,
  deleteMessage,
  sendTextMessage,
  sendVoiceNoteMessage,
  sendDocumentMessage,
  sendListingMessage,
  sendEmbedMessage,
  sendInquiryTemplate,
  sendInquiryResponse,
} from './message';

/**
 * MessageRepository encapsulates all message persistence, queries, attachments,
 * reactions, and key-set cursor pagination for thread chats.
 *
 * Core Contract Invariants:
 * - 500k CCU NULL-Safe Filter: .or('intent.neq.internal_note,intent.is.null')
 * - Audio pipeline: sendVoiceNoteMessage
 * - File pipeline: sendDocumentMessage
 * - Presentation: sendTextMessage, sendListingMessage, sendEmbedMessage
 * - Inquiry pipeline: sendInquiryTemplate, sendInquiryResponse
 * - Interactivity: toggleMessageReaction, deleteMessage
 */
export const messageRepository = {
  fetchThreadMessages,
  toggleMessageStar,
  toggleMessageReaction,
  deleteMessage,
  markConversationRead,
  markConversationDelivered,
  sendTextMessage,
  sendVoiceNoteMessage,
  sendDocumentMessage,
  sendListingMessage,
  sendEmbedMessage,
  sendInquiryTemplate,
  sendInquiryResponse,
};
