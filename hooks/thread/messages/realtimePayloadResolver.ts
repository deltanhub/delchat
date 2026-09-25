import type { ChatMessage } from '../../../components/chat/bubbles/types';

export function resolveAttachmentsFromPayload(newMsg: any): any[] {
  if (Array.isArray(newMsg.structured_payload?.attachments)) {
    return newMsg.structured_payload.attachments.map((att: any, idx: number) => ({
      id: att.id || `${newMsg.id}-att-${idx}`,
      url: att.url,
      originalName: att.originalName || att.original_name || 'Attachment',
      mimeType: att.mimeType || att.mime_type || (att.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      sizeBytes: att.sizeBytes || att.size_bytes || 0,
      kind: att.kind || 'image',
    }));
  }
  if (newMsg.structured_payload?.document) {
    const doc = newMsg.structured_payload.document;
    return [
      {
        id: `${newMsg.id}-doc`,
        url: doc.url,
        originalName: doc.name || 'Document',
        mimeType: doc.mimeType || 'application/pdf',
        sizeBytes: doc.size || 0,
        kind: 'document',
      },
    ];
  }
  return [];
}

export function buildIncomingMessage(newMsg: any, initialAttachments: any[], partnerName?: string): ChatMessage {
  return {
    id: newMsg.id,
    senderType: newMsg.sender_type || 'user',
    senderUserId: newMsg.sender_user_id,
    authorName: partnerName || 'Partner',
    authorRoleLabel: 'Seller',
    status: 'delivered',
    messageKind: newMsg.message_kind || 'text',
    body: newMsg.body || '',
    sentAt: newMsg.created_at,
    intent: newMsg.intent,
    attachments: initialAttachments,
    listingCard: newMsg.structured_payload?.listingCard || null,
    inquiryFormCard: newMsg.structured_payload?.inquiryFormCard || (newMsg.message_kind === 'inquiry_form' ? newMsg.structured_payload : null),
    inquiryResponseCard: newMsg.structured_payload?.inquiryResponseCard || (newMsg.message_kind === 'inquiry_response' ? newMsg.structured_payload : null),
    reactions: newMsg.reactions || newMsg.structured_payload?.reactions || {},
    structuredPayload: newMsg.structured_payload || {},
  };
}

export function buildOutgoingMessage(newMsg: any, initialAttachments: any[]): ChatMessage {
  return {
    id: newMsg.id,
    senderType: newMsg.sender_type || 'user',
    senderUserId: newMsg.sender_user_id,
    authorName: 'You',
    authorRoleLabel: 'You',
    status: 'sent',
    messageKind: newMsg.message_kind || 'text',
    body: newMsg.body || '',
    sentAt: newMsg.created_at,
    intent: newMsg.intent,
    attachments: initialAttachments,
    listingCard: newMsg.structured_payload?.listingCard || null,
    inquiryFormCard: newMsg.structured_payload?.inquiryFormCard || (newMsg.message_kind === 'inquiry_form' ? newMsg.structured_payload : null),
    inquiryResponseCard: newMsg.structured_payload?.inquiryResponseCard || (newMsg.message_kind === 'inquiry_response' ? newMsg.structured_payload : null),
    reactions: newMsg.reactions || newMsg.structured_payload?.reactions || {},
    structuredPayload: newMsg.structured_payload || {},
  };
}
