import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../../lib/supabase';
import { uploadLocalFileToSupabaseStorage } from '../../../lib/media-utils';
import { dispatchPushNotification } from '../../../lib/push-notifications';
import { broadcastInboxAlert } from '../../../lib/sync-coordinator';
import * as Haptics from '../../../lib/haptics';

export function useDocumentPickerActions(
  conversationId: string,
  currentUser: any,
  partnerUserId: string | null | undefined,
  ensureParticipantAuthorization: () => Promise<boolean>,
  isPickingActiveRef: React.MutableRefObject<boolean>,
  onMediaSent?: () => void
) {
  const handleSendDocument = useCallback(async (doc: DocumentPicker.DocumentPickerAsset) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      const fileName = `doc_${Date.now()}_${doc.name}`;
      const mime = doc.mimeType || 'application/pdf';
      const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
        supabase,
        'chat-attachments',
        fileName,
        doc.uri,
        mime
      );
      if (uploadErr || !signedUrl) {
        throw new Error(uploadErr?.message || 'Failed to upload document');
      }

      const { data: msgRow, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_user_id: currentUser.id,
          message_kind: 'attachments',
          body: doc.name || 'Document Attached',
          intent: 'general',
          structured_payload: {
            document: {
              name: doc.name,
              size: doc.size,
              mimeType: mime,
              url: signedUrl,
            },
            attachments: [
              {
                url: signedUrl,
                kind: 'document',
                originalName: doc.name,
                sizeBytes: doc.size || 0,
                mimeType: mime,
              },
            ],
          },
        })
        .select('id, created_at')
        .single();

      if (msgErr) throw msgErr;

      if (msgRow) {
        try {
          await supabase.from('chat_message_attachments').insert({
            message_id: msgRow.id,
            attachment_kind: 'document',
            storage_bucket: 'chat-attachments',
            storage_path: fileName,
            original_name: doc.name,
            safe_name: fileName,
            mime_type: mime,
            size_bytes: doc.size || 0,
            scan_status: 'passed',
          });
        } catch (attErr) {
          console.warn('Document attachment insert warning:', attErr);
        }

        void dispatchPushNotification({
          conversationId,
          messageId: msgRow.id,
          body: `📄 Sent document: ${doc.name}`,
          senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
          messageKind: 'attachments',
        });

        broadcastInboxAlert({
          recipientUserId: partnerUserId,
          conversationId,
          senderUserId: currentUser.id,
        });

        if (onMediaSent) onMediaSent();
      }
    } catch (e: any) {
      Alert.alert('Document Error', e.message);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, onMediaSent]);

  const handlePickDocument = useCallback(async () => {
    if (isPickingActiveRef.current) return;
    isPickingActiveRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const docRes = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!docRes.canceled && docRes.assets && docRes.assets.length > 0) {
        const doc = docRes.assets[0];
        await handleSendDocument(doc);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        msg.includes('Different document picking in progress') ||
        msg.includes('PickingInProgressException') ||
        msg.includes('User canceled') ||
        msg.includes('cancelled') ||
        msg.includes('canceled')
      ) {
        return;
      }
      Alert.alert('Document Error', msg);
    } finally {
      setTimeout(() => {
        isPickingActiveRef.current = false;
      }, 400);
    }
  }, [handleSendDocument, isPickingActiveRef]);

  return {
    handleSendDocument,
    handlePickDocument,
  };
}
