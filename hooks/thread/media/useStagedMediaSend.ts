import { useCallback } from 'react';
import { Alert } from 'react-native';
import type * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { uploadLocalFileToSupabaseStorage } from '../../../lib/media-utils';
import { dispatchPushNotification } from '../../../lib/push-notifications';
import { broadcastInboxAlert } from '../../../lib/sync-coordinator';

export function useStagedMediaSend(
  conversationId: string,
  currentUser: any,
  partnerUserId: string | null | undefined,
  ensureParticipantAuthorization: () => Promise<boolean>,
  setIsUploadingMedia: React.Dispatch<React.SetStateAction<boolean>>,
  setMediaPreviewVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setStagedMediaAssets: React.Dispatch<React.SetStateAction<ImagePicker.ImagePickerAsset[]>>,
  onMediaSent?: () => void
) {
  return useCallback(async (assets: ImagePicker.ImagePickerAsset[], caption: string) => {
    if (!conversationId || !currentUser || assets.length === 0) return;
    setIsUploadingMedia(true);
    try {
      if (!(await ensureParticipantAuthorization())) {
        setIsUploadingMedia(false);
        return;
      }
      for (const asset of assets) {
        const isVideo = asset.type === 'video' || asset.uri.endsWith('.mp4');
        const ext = isVideo ? 'mp4' : 'jpg';
        const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
        const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
          supabase,
          'chat-attachments',
          fileName,
          asset.uri,
          mimeType
        );
        if (uploadErr || !signedUrl) {
          throw new Error(uploadErr?.message || 'Failed to upload media');
        }

        const { data: msgRow, error: msgErr } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender_type: 'user',
            sender_user_id: currentUser.id,
            message_kind: 'attachments',
            body: caption.trim() || (isVideo ? 'Video attachment' : 'Photo attachment'),
            intent: 'general',
            structured_payload: {
              attachments: [
                {
                  url: signedUrl,
                  kind: isVideo ? 'video' : 'image',
                  originalName: asset.fileName || fileName,
                  sizeBytes: asset.fileSize || 0,
                  mimeType,
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
              attachment_kind: isVideo ? 'video' : 'image',
              storage_bucket: 'chat-attachments',
              storage_path: fileName,
              original_name: asset.fileName || fileName,
              safe_name: fileName,
              mime_type: mimeType,
              size_bytes: asset.fileSize || 0,
              scan_status: 'passed',
            });
          } catch (attErr) {
            console.warn('Media attachment insert warning:', attErr);
          }

          void dispatchPushNotification({
            conversationId,
            messageId: msgRow.id,
            body: caption.trim() || (isVideo ? '🎥 Sent a video' : '📷 Sent a photo'),
            senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
            messageKind: 'attachments',
          });

          broadcastInboxAlert({
            recipientUserId: partnerUserId,
            conversationId,
            senderUserId: currentUser.id,
          });
        }
      }
      setMediaPreviewVisible(false);
      setStagedMediaAssets([]);
      if (onMediaSent) onMediaSent();
    } catch (e: any) {
      Alert.alert('Media Upload Error', e.message);
    } finally {
      setIsUploadingMedia(false);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, setIsUploadingMedia, setMediaPreviewVisible, setStagedMediaAssets, onMediaSent]);
}
