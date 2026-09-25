import { supabase } from '../supabase';
import OfflineEngine from '../offline-engine';
import { uploadLocalFileToSupabaseStorage } from '../media-utils';
import { dispatchPushNotification } from '../push-notifications';
import { getStatus, setStatus } from './networkMonitor';

let _isDraining = false;

/** Drain offline outbox in FIFO order, upload media, write to chat_messages */
export async function drainOutbox(
  supabaseClient: any = supabase,
  conversationId?: string,
  onMessageSent?: (tempId: string, serverData: any) => void
): Promise<number> {
  if (_isDraining) return 0;
  _isDraining = true;

  try {
    const items = await OfflineEngine.getOutbox(conversationId);
    if (!items || items.length === 0) return 0;

    const wasOffline = getStatus() === 'offline';
    if (wasOffline) setStatus('syncing');
    let successCount = 0;

    for (const item of items) {
      try {
        let structuredPayload = item.structuredPayload || {};
        let uploadedFileName: string | null = null;
        let uploadedMimeType: string | null = null;

        if (item.localMediaUri) {
          const ext = item.messageKind === 'voice_note' ? 'm4a' : 'jpg';
          const fileName = item.fileName || `outbox_${item.messageKind}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
          if (isRateLimit) break;
          continue;
        }

        if (data) {
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

          await OfflineEngine.removeOutbox(item.id);
          await OfflineEngine.updateMessageStatus(item.conversationId, item.id, data.id, 'sent', data.created_at);

          if (onMessageSent) onMessageSent(item.id, data);
          void dispatchPushNotification({
            conversationId: item.conversationId,
            messageId: data.id,
            body: item.body || '',
            messageKind: item.messageKind || 'text',
          });
          successCount++;
        }
      } catch (itemErr: any) {
        console.warn(`[SyncCoordinator] Error processing outbox item ${item.id}:`, itemErr);
        await OfflineEngine.incrementOutboxRetry(item.id, itemErr?.message);
      }
    }

    if (wasOffline) setStatus('online');
    return successCount;
  } catch (e) {
    console.warn('[SyncCoordinator] Outbox drain failed:', e);
    return 0;
  } finally {
    _isDraining = false;
  }
}
