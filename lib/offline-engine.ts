import type { ChatMessage } from '../components/chat/MessageBubble';
import type { ChatConversation } from '../components/chat/ConversationRow';
import {
  OutboxItem,
  getMessagesSync,
  saveSingleMessage,
  getMessages,
  saveMessages,
  updateMessageStatus,
  getLatestTimestamp,
  getConversationSync,
  getConversations,
  saveConversations,
  saveSingleConversation,
  getOutbox,
  enqueueOutbox,
  removeOutbox,
  incrementOutboxRetry,
  clearOutbox,
} from './offline';

export type { OutboxItem };

export const OfflineEngine = {
  // Messages Cache & Hot Hydration
  getMessagesSync(conversationId: string): ChatMessage[] {
    return getMessagesSync(conversationId);
  },
  saveSingleMessage(conversationId: string, message: ChatMessage): void {
    saveSingleMessage(conversationId, message);
  },
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return getMessages(conversationId);
  },
  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    return saveMessages(conversationId, messages);
  },
  async updateMessageStatus(
    conversationId: string,
    targetId: string,
    newId: string | null,
    newStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'error',
    serverTimestamp?: string
  ): Promise<void> {
    return updateMessageStatus(conversationId, targetId, newId, newStatus, serverTimestamp);
  },
  async getLatestTimestamp(conversationId: string): Promise<string | null> {
    return getLatestTimestamp(conversationId);
  },

  // Conversation Cache
  getConversationSync(conversationId: string): ChatConversation | null {
    return getConversationSync(conversationId);
  },
  async getConversations(): Promise<ChatConversation[]> {
    return getConversations();
  },
  async saveConversations(convos: ChatConversation[]): Promise<void> {
    return saveConversations(convos);
  },
  saveSingleConversation(conversation: ChatConversation): void {
    saveSingleConversation(conversation);
  },

  // Resilient Outbox
  async getOutbox(conversationId?: string): Promise<OutboxItem[]> {
    return getOutbox(conversationId);
  },
  async enqueueOutbox(item: OutboxItem): Promise<void> {
    return enqueueOutbox(item);
  },
  async removeOutbox(id: string): Promise<void> {
    return removeOutbox(id);
  },
  async incrementOutboxRetry(id: string, error?: string): Promise<void> {
    return incrementOutboxRetry(id, error);
  },
  async clearOutbox(conversationId?: string): Promise<void> {
    return clearOutbox(conversationId);
  },
};

export default OfflineEngine;
