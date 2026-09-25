import type { StarredMessageItem } from '../../components/chat/starred/types';

export function mapRpcRow(r: any): StarredMessageItem {
  return {
    starredId: r.starred_id || r.id,
    starredAt: r.starred_at || r.created_at,
    messageId: r.message_id,
    conversationId: r.conversation_id,
    conversationTitle: r.conversation_title || 'Chat',
    conversationKind: r.conversation_kind || 'direct',
    senderUserId: r.sender_user_id,
    senderName: r.sender_name || 'Member',
    senderType: r.sender_type || 'user',
    messageKind: r.message_kind || 'text',
    body: r.body || '',
    intent: r.intent || null,
    structuredPayload: r.structured_payload || null,
    createdAt: r.created_at,
    attachments: r.attachments || [],
  };
}

export function mapFallbackRow(r: any): StarredMessageItem {
  const m = r.message || {};
  const conv = m.conversation;
  return {
    starredId: r.id,
    starredAt: r.created_at,
    messageId: m.id,
    conversationId: m.conversation_id,
    conversationTitle: conv?.title || conv?.context_snapshot?.title || 'Chat',
    conversationKind: conv?.conversation_kind || 'direct',
    senderUserId: m.sender_user_id,
    senderName: m.sender_type === 'assistant' ? 'Deltan AI' : 'Member',
    senderType: m.sender_type || 'user',
    messageKind: m.message_kind || 'text',
    body: m.body || '',
    intent: m.intent || null,
    structuredPayload: m.structured_payload || null,
    createdAt: m.created_at,
    attachments: m.attachments || [],
  };
}
