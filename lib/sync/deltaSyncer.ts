import { supabase } from '../supabase';
import OfflineEngine from '../offline-engine';
import type { ChatMessage, ChatAttachmentItem } from '../../components/chat/bubbles/types';
import { getStatus, setStatus } from './networkMonitor';

/**
 * Delta Sync: Fetches only messages created since the latest cached timestamp
 * for a specific conversation and merges them into the local cache.
 */
export async function executeDeltaSync(
  supabaseClient: any = supabase,
  conversationId: string,
  currentUserId?: string
): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  try {
    const lastTimestamp = await OfflineEngine.getLatestTimestamp(conversationId);
    if (!lastTimestamp) return [];

    const wasOffline = getStatus() === 'offline';
    if (wasOffline) setStatus('syncing');

    const { data: rawRows, error } = await supabaseClient
      .from('chat_messages')
      .select(`
        id, conversation_id, sender_type, sender_user_id, sender_assistant_key,
        message_kind, body, created_at, read_at, delivered_at, intent,
        structured_payload, message_status
      `)
      .eq('conversation_id', conversationId)
      .gt('created_at', lastTimestamp)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!rawRows || rawRows.length === 0) {
      if (wasOffline) setStatus('online');
      return [];
    }

    const msgIds = rawRows.map((r: any) => r.id);
    const senderIds = Array.from(
      new Set(rawRows.map((r: any) => r.sender_user_id).filter(Boolean))
    );

    // 1. Resolve attachments
    const attachmentsByMessage: Record<string, ChatAttachmentItem[]> = {};
    try {
      const { data: attRows } = await supabaseClient
        .from('chat_message_attachments')
        .select('id, message_id, storage_bucket, storage_path, original_name, mime_type, size_bytes, attachment_kind')
        .in('message_id', msgIds);

      (attRows || []).forEach((att: any) => {
        if (!attachmentsByMessage[att.message_id]) {
          attachmentsByMessage[att.message_id] = [];
        }
        attachmentsByMessage[att.message_id].push({
          id: att.id,
          url: att.storage_path,
          originalName: att.original_name || 'Attachment',
          mimeType: att.mime_type || 'application/octet-stream',
          sizeBytes: att.size_bytes || 0,
          kind: (att.attachment_kind as ChatAttachmentItem['kind']) || (att.mime_type?.startsWith('image/')
            ? 'image'
            : att.mime_type?.startsWith('video/')
            ? 'video'
            : att.mime_type?.startsWith('audio/')
            ? 'audio'
            : 'document'),
        });
      });
    } catch (attErr) {
      console.warn('[SyncCoordinator] Delta attachments fetch warning:', attErr);
    }

    // 2. Resolve sender profiles
    const profileMap = new Map<string, string>();
    if (senderIds.length > 0) {
      try {
        const { data: profiles } = await supabaseClient.rpc('get_public_user_profiles', {
          requested_user_ids: senderIds,
        });
        profiles?.forEach((p: any) => {
          profileMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User');
        });
      } catch (profErr) {
        console.warn('[SyncCoordinator] Delta profiles fetch warning:', profErr);
      }
    }

    const mappedNew: ChatMessage[] = rawRows.map((msg: any) => {
      const senderName = msg.sender_user_id ? profileMap.get(msg.sender_user_id) : null;
      const rawPayload = msg.structured_payload || {};
      const isSelf = currentUserId && msg.sender_user_id === currentUserId;

      return {
        id: msg.id,
        senderType: msg.sender_type || 'user',
        senderUserId: msg.sender_user_id,
        authorName: isSelf ? 'You' : (senderName || 'Member'),
        authorRoleLabel: isSelf ? 'You' : 'Member',
        status: msg.read_at ? 'read' : msg.delivered_at ? 'delivered' : 'sent',
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

    await OfflineEngine.saveMessages(conversationId, mappedNew);
    if (wasOffline) setStatus('online');
    return mappedNew;
  } catch (err) {
    console.warn('[SyncCoordinator] Delta sync failed:', err);
    return [];
  }
}
