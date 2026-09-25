import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { uploadLocalFileToSupabaseStorage } from '../../../lib/media-utils';
import { dispatchPushNotification } from '../../../lib/push-notifications';
import { broadcastInboxAlert } from '../../../lib/sync-coordinator';
import OfflineEngine from '../../../lib/offline-engine';
import * as Haptics from '../../../lib/haptics';

export function useVoiceNoteSend(
  conversationId: string,
  currentUser: any,
  partnerUserId: string | null | undefined,
  ensureParticipantAuthorization: () => Promise<boolean>,
  onAddOptimisticMessage?: (msg: any) => void,
  onUpdateOptimisticMessage?: (tempId: string, updates: any) => void,
  onRemoveOptimisticMessage?: (tempId: string) => void,
  onMediaSent?: () => void
) {
  return useCallback(async (duration: number, audioUri?: string) => {
    if (!conversationId || !currentUser || !audioUri || duration <= 0) return;
    const cleanDuration = Math.max(1, Math.round(duration));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tempId = `optimistic-vn-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderType: 'user',
      senderUserId: currentUser.id,
      authorName: 'You',
      authorRoleLabel: 'You',
      status: 'sending',
      messageKind: 'voice_note',
      body: 'Voice note',
      sentAt: new Date().toISOString(),
      intent: 'general',
      structuredPayload: {
        voiceNote: {
          durationSeconds: cleanDuration,
          audioUrl: audioUri,
          localUri: audioUri,
        },
      },
    };

    if (onAddOptimisticMessage) onAddOptimisticMessage(optimisticMsg);

    try {
      if (!(await ensureParticipantAuthorization())) {
        if (onRemoveOptimisticMessage) onRemoveOptimisticMessage(tempId);
        return;
      }
      const fileName = `vn_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`;
      const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
        supabase,
        'chat-attachments',
        fileName,
        audioUri,
        'audio/m4a'
      );

      if (uploadErr || !signedUrl) {
        throw new Error(uploadErr?.message || 'Failed to upload voice note to cloud storage');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_user_id: currentUser.id,
          message_kind: 'voice_note',
          body: 'Voice note',
          intent: 'general',
          structured_payload: {
            voiceNote: {
              durationSeconds: cleanDuration,
              audioUrl: signedUrl,
              localUri: audioUri,
            },
          },
        })
        .select('id, created_at')
        .single();

      if (error) throw error;
      if (data) {
        try {
          await supabase.from('chat_message_attachments').insert({
            message_id: data.id,
            attachment_kind: 'audio',
            storage_bucket: 'chat-attachments',
            storage_path: fileName,
            original_name: fileName,
            safe_name: fileName,
            mime_type: 'audio/m4a',
            size_bytes: 0,
            scan_status: 'passed',
          });
        } catch (attErr) {
          console.warn('Voice note attachment insert warning:', attErr);
        }

        if (onUpdateOptimisticMessage) {
          onUpdateOptimisticMessage(tempId, { id: data.id, sentAt: data.created_at, status: 'sent' });
        }
        await OfflineEngine.removeOutbox(tempId);
        await OfflineEngine.updateMessageStatus(conversationId, tempId, data.id, 'sent', data.created_at);
        void dispatchPushNotification({
          conversationId,
          messageId: data.id,
          body: '🎤 Sent a voice note',
          senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
          messageKind: 'voice_note',
        });

        broadcastInboxAlert({
          recipientUserId: partnerUserId,
          conversationId,
          senderUserId: currentUser.id,
        });

        if (onMediaSent) onMediaSent();
      }
    } catch (err: any) {
      console.warn('[Voice Note Offline] Preserving in outbox queue:', err);
      if (onUpdateOptimisticMessage) {
        onUpdateOptimisticMessage(tempId, { status: 'sending' });
      }
      await OfflineEngine.enqueueOutbox({
        id: tempId,
        conversationId,
        senderUserId: currentUser.id,
        messageKind: 'voice_note',
        body: 'Voice note',
        localMediaUri: audioUri,
        durationSeconds: cleanDuration,
        mediaKind: 'audio',
        mimeType: 'audio/m4a',
        createdAt: optimisticMsg.sentAt,
        retryCount: 0,
        error: err?.message,
      });
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, onAddOptimisticMessage, onUpdateOptimisticMessage, onRemoveOptimisticMessage, onMediaSent]);
}
