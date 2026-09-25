import OfflineEngine from '../../../lib/offline-engine';
import { addPendingMessage } from '../../../lib/cache-manager';

export async function enqueueFailedMessage(
  conversationId: string,
  tempId: string,
  text: string,
  userId: string,
  sentAt: string,
  structuredPayload: any,
  error: string
) {
  await addPendingMessage(conversationId, {
    id: tempId,
    body: text,
    senderUserId: userId,
    createdAt: sentAt,
    messageKind: 'text',
    isPending: true,
  });

  await OfflineEngine.enqueueOutbox({
    id: tempId,
    conversationId,
    senderUserId: userId,
    messageKind: 'text',
    body: text,
    intent: 'general',
    structuredPayload: structuredPayload || {},
    createdAt: sentAt,
    retryCount: 0,
    error,
  });
}
