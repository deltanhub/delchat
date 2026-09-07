import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from './supabase';
import OfflineEngine, { OutboxItem } from './offline-engine';
import { uploadLocalFileToSupabaseStorage } from './media-utils';
import { dispatchPushNotification } from './push-notifications';
import type { ChatMessage, ChatAttachmentItem } from '../components/chat/bubbles/types';

export type SyncStatus = 'online' | 'offline' | 'syncing';

let _syncStatus: SyncStatus = 'online';
const _statusListeners = new Set<(status: SyncStatus) => void>();
let _isDraining = false;
let _appStateSubscribed = false;

function ensureAppStateListener() {
  if (_appStateSubscribed) return;
  _appStateSubscribed = true;
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void SyncCoordinator.checkConnectivity();
      void supabase.rpc('touch_user_presence');
    }
  });
}

export const SyncCoordinator = {
  getStatus(): SyncStatus {
    return _syncStatus;
  },

  setStatus(status: SyncStatus): void {
    if (_syncStatus === status) return;
    _syncStatus = status;
    _statusListeners.forEach((fn) => fn(status));
  },

  /**
   * Proactively verify active internet connectivity against the API.
   * Updates status to 'online' or 'offline' based on real network reachability.
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://deltanhub.com', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      const isOnline = res.status < 500;
      this.setStatus(isOnline ? 'online' : 'offline');
      return isOnline;
    } catch {
      this.setStatus('offline');
      return false;
    }
  },

  subscribe(listener: (status: SyncStatus) => void): () => void {
    ensureAppStateListener();
    _statusListeners.add(listener);
    listener(_syncStatus);
    return () => {
      _statusListeners.delete(listener);
    };
  },

  /**
   * Drain offline pending outbox in FIFO order.
   * Uploads any local media files, writes to chat_messages,
   * updates local cache, and triggers callback.
   */
  async drainOutbox(
    supabaseClient: any = supabase,
    conversationId?: string,
    onMessageSent?: (tempId: string, serverData: any) => void
  ): Promise<number> {
    if (_isDraining) return 0;
    _isDraining = true;

    try {
      const items = await OfflineEngine.getOutbox(conversationId);
      if (!items || items.length === 0) {
        return 0;
      }

      this.setStatus('syncing');
      let successCount = 0;

      for (const item of items) {
        try {
          let structuredPayload = item.structuredPayload || {};
          let uploadedFileName: string | null = null;
          let uploadedMimeType: string | null = null;

          // Handle Voice Note or Attachment upload if local media URI exists
          if (item.localMediaUri) {
            const fileName =
              item.fileName ||
              `outbox_${item.messageKind}_${Date.now()}_${Math.random().toString(36).substring(7)}.${
                item.messageKind === 'voice_note' ? 'm4a' : 'jpg'
              }`;

            const mime = item.mimeType || (item.messageKind === 'voice_note' ? 'audio/m4a' : 'image/jpeg');
            const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
              supabaseClient,
              'chat-attachments',
              fileName,
              item.localMediaUri,
              mime
            );

            if (uploadErr || !signedUrl) {
              console.warn('[SyncCoordinator] Media upload deferred:', uploadErr);
              await OfflineEngine.incrementOutboxRetry(item.id, uploadErr?.message);
              continue;
            }

            uploadedFileName = fileName;
            uploadedMimeType = mime;

            if (item.messageKind === 'voice_note') {
              structuredPayload = {
                ...structuredPayload,
                voiceNote: {
                  durationSeconds: item.durationSeconds || 1,
                  audioUrl: signedUrl,
                  localUri: item.localMediaUri,
                },
              };
            }
          }

          // Insert into Supabase chat_messages
          const { data, error: insertErr } = await supabaseClient
            .from('chat_messages')
            .insert({
              conversation_id: item.conversationId,
              sender_type: 'user',
              sender_user_id: item.senderUserId,
              message_kind: item.messageKind,
              body: item.body,
              intent: item.intent || 'general',
              structured_payload: structuredPayload,
            })
            .select('id, created_at')
            .single();

          if (insertErr) {
            console.warn(`[SyncCoordinator] Outbox insert failed for ${item.id}:`, insertErr);
            const isRateLimit = (insertErr.message || '').includes('rate_limit');
            await OfflineEngine.incrementOutboxRetry(item.id, insertErr.message);

            if (isRateLimit) {
              // Pause drain briefly on rate limit
              break;
            }
            continue;
          }

          if (data) {
            // Save attachment row if media was uploaded
            if (uploadedFileName) {
              try {
                const attKind = item.messageKind === 'voice_note' ? 'audio' : 'image';
                await supabaseClient.from('chat_message_attachments').insert({
                  message_id: data.id,
                  attachment_kind: attKind,
                  storage_bucket: 'chat-attachments',
                  storage_path: uploadedFileName,
                  original_name: item.fileName || uploadedFileName,
                  safe_name: uploadedFileName,
                  mime_type: uploadedMimeType || (attKind === 'audio' ? 'audio/m4a' : 'image/jpeg'),
                  size_bytes: item.fileSizeBytes || 0,
                  scan_status: 'passed',
                });
              } catch (attErr) {
                console.warn('[SyncCoordinator] Outbox attachment insert warning:', attErr);
              }
            }

            // Success: remove from outbox and update local cache status
            await OfflineEngine.removeOutbox(item.id);
            await OfflineEngine.updateMessageStatus(
              item.conversationId,
              item.id,
              data.id,
              'sent',
              data.created_at
            );

            if (onMessageSent) {
              onMessageSent(item.id, data);
            }
            void dispatchPushNotification({
              conversationId: item.conversationId,
              messageId: data.id,
              body: item.body || '',
              messageKind: item.messageKind || 'text',
            });
            successCount++;
          }
        } catch (itemErr: any) {
          console.warn(`[SyncCoordinator] Unexpected error processing outbox item ${item.id}:`, itemErr);
          await OfflineEngine.incrementOutboxRetry(item.id, itemErr?.message);
        }
      }

      this.setStatus('online');
      return successCount;
    } catch (e) {
      console.warn('[SyncCoordinator] Outbox drain failed:', e);
      this.setStatus('offline');
      return 0;
    } finally {
      _isDraining = false;
    }
  },

  /**
   * Delta Sync: Fetches only messages created since the latest cached timestamp
   * for a specific conversation and merges them into the local cache.
   */
  async executeDeltaSync(
    supabaseClient: any = supabase,
    conversationId: string,
    currentUserId?: string
  ): Promise<ChatMessage[]> {
    if (!conversationId) return [];

    try {
      const lastTimestamp = await OfflineEngine.getLatestTimestamp(conversationId);
      if (!lastTimestamp) {
        // No cached baseline, caller should run initial full fetch
        return [];
      }

      this.setStatus('syncing');

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
        this.setStatus('online');
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

      // Save into local cache
      await OfflineEngine.saveMessages(conversationId, mappedNew);
      this.setStatus('online');
      return mappedNew;
    } catch (err) {
      console.warn('[SyncCoordinator] Delta sync failed:', err);
      this.setStatus('offline');
      return [];
    }
  },
};

export default SyncCoordinator;
