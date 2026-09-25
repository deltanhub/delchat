import { supabase } from '../../supabase';
import { ChatMessage, ChatAttachmentItem } from '../../../components/chat/bubbles/types';
import { DbMessageRow, FetchMessagesParams, FetchMessagesResult } from './types';

export async function fetchThreadMessages(params: FetchMessagesParams): Promise<FetchMessagesResult> {
  const { conversationId, currentUserId, limit = 30, beforeTimestamp, partnerLastReadTime, clearedHistoryAt } = params;

  let cutoff = clearedHistoryAt;
  if (cutoff === undefined && currentUserId) {
    try {
      const { data: part } = await supabase
        .from('chat_participants')
        .select('cleared_history_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)
        .maybeSingle();
      cutoff = part?.cleared_history_at || null;
    } catch {
      cutoff = null;
    }
  }

  let query = supabase
    .from('chat_messages')
    .select(`
      id, conversation_id, sender_type, sender_user_id, sender_assistant_key,
      message_kind, body, intent, structured_payload, reactions, created_at,
      message_status, delivered_at, read_at
    `)
    .eq('conversation_id', conversationId)
    .or('intent.neq.internal_note,intent.is.null');

  if (cutoff) query = query.gt('created_at', cutoff);
  query = query.order('created_at', { ascending: false }).limit(limit);
  if (beforeTimestamp) query = query.lt('created_at', beforeTimestamp);

  const { data: rawMsgRows, error: msgError } = await query;
  if (msgError) throw msgError;

  const msgRows = ((rawMsgRows as DbMessageRow[]) || []).filter((m) => m.intent !== 'internal_note');
  const hasMore = msgRows.length >= limit;
  const msgIds = msgRows.map((m) => m.id);

  const starredMsgIds = new Set<string>();
  if (msgIds.length > 0) {
    try {
      const { data: starredRows } = await supabase
        .from('chat_starred_messages')
        .select('message_id')
        .eq('user_id', currentUserId)
        .in('message_id', msgIds);
      starredRows?.forEach((s: any) => starredMsgIds.add(s.message_id));
    } catch {}
  }

  const attachmentsByMessage: Record<string, ChatAttachmentItem[]> = {};
  if (msgIds.length > 0) {
    try {
      const { data: attRows } = await supabase.from('chat_message_attachments').select('*').in('message_id', msgIds);
      if (attRows && attRows.length > 0) {
        await Promise.all(
          attRows.map(async (att: any) => {
            if (!attachmentsByMessage[att.message_id]) attachmentsByMessage[att.message_id] = [];
            let finalUrl = '';
            const bucket = att.storage_bucket || 'chat-attachments';
            try {
              const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(att.storage_path, 86400);
              finalUrl = signedData?.signedUrl || '';
            } catch {
              finalUrl = att.storage_path;
            }
            attachmentsByMessage[att.message_id].push({
              id: att.id,
              url: finalUrl,
              originalName: att.original_name || att.original_file_name || 'Attachment',
              mimeType: att.mime_type || 'application/octet-stream',
              sizeBytes: att.size_bytes || att.file_size_bytes || 0,
              kind: (att.attachment_kind as ChatAttachmentItem['kind']) || (att.mime_type?.startsWith('image/') ? 'image' : att.mime_type?.startsWith('video/') ? 'video' : att.mime_type?.startsWith('audio/') ? 'audio' : 'document'),
            });
          })
        );
      }
    } catch {}
  }

  const senderIds = Array.from(new Set(msgRows.map((m) => m.sender_user_id).filter((id): id is string => Boolean(id))));
  const profilesMap = new Map<string, string>();
  if (senderIds.length > 0) {
    try {
      const { data: profiles } = await supabase.rpc('get_public_user_profiles', { requested_user_ids: senderIds });
      profiles?.forEach((p: any) => profilesMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User'));
    } catch {}
  }

  const messages: ChatMessage[] = msgRows.map((msg: any) => {
    const senderName = msg.sender_user_id ? profilesMap.get(msg.sender_user_id) : null;
    const rawPayload = msg.structured_payload || {};
    let computedStatus: 'sending' | 'sent' | 'delivered' | 'read' = 'sent';
    const msgTime = new Date(msg.created_at).getTime();

    if (msg.read_at || (partnerLastReadTime && partnerLastReadTime >= msgTime) || msg.message_status === 'read') {
      computedStatus = 'read';
    } else if (msg.delivered_at || msg.message_status === 'delivered') {
      computedStatus = 'delivered';
    }

    return {
      id: msg.id,
      senderType: msg.sender_type || 'user',
      senderUserId: msg.sender_user_id,
      authorName: msg.sender_user_id === currentUserId ? 'You' : senderName || 'Partner',
      authorRoleLabel: msg.sender_user_id === currentUserId ? 'You' : 'Seller',
      status: computedStatus,
      messageKind: msg.message_kind || 'text',
      body: msg.body || '',
      sentAt: msg.created_at,
      readAt: msg.read_at,
      deliveredAt: msg.delivered_at,
      intent: msg.intent,
      attachments: attachmentsByMessage[msg.id] || [],
      listingCard: rawPayload.listingCard || null,
      inquiryFormCard: rawPayload.inquiryFormCard || (msg.message_kind === 'inquiry_form' ? rawPayload : null),
      inquiryResponseCard: rawPayload.inquiryResponseCard || (msg.message_kind === 'inquiry_response' ? rawPayload : null),
      reactions: msg.reactions || rawPayload.reactions || {},
      structuredPayload: rawPayload,
    };
  });

  return { messages, hasMore, starredMsgIds };
}
