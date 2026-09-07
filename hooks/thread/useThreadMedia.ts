import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { uploadLocalFileToSupabaseStorage } from '../../lib/media-utils';
import { dispatchPushNotification } from '../../lib/push-notifications';
import { broadcastInboxAlert } from '../../lib/sync-coordinator';
import OfflineEngine from '../../lib/offline-engine';
import * as Haptics from '../../lib/haptics';

export interface UseThreadMediaParams {
  conversationId: string;
  currentUser: any;
  partnerUserId?: string | null;
  ensureParticipantAuthorization: () => Promise<boolean>;
  onMediaSent?: () => void;
  onAddOptimisticMessage?: (msg: any) => void;
  onUpdateOptimisticMessage?: (tempId: string, updates: any) => void;
  onRemoveOptimisticMessage?: (tempId: string) => void;
}

export function useThreadMedia({
  conversationId,
  currentUser,
  partnerUserId,
  ensureParticipantAuthorization,
  onMediaSent,
  onAddOptimisticMessage,
  onUpdateOptimisticMessage,
  onRemoveOptimisticMessage,
}: UseThreadMediaParams) {
  // Concurrency guard to prevent iOS PickingInProgressException collisions
  const isPickingActiveRef = useRef(false);

  // Staged media state for preview modal
  const [stagedMediaAssets, setStagedMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Fullscreen media viewer state
  const [mediaViewerUrl, setMediaViewerUrl] = useState<string | null>(null);
  const [mediaViewerKind, setMediaViewerKind] = useState<'image' | 'video'>('image');
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);

  const openMediaViewer = useCallback((url: string, kind: 'image' | 'video' = 'image') => {
    setMediaViewerUrl(url);
    setMediaViewerKind(kind);
    setMediaViewerVisible(true);
  }, []);

  const closeMediaViewer = useCallback(() => {
    setMediaViewerVisible(false);
    setMediaViewerUrl(null);
  }, []);

  const openMediaPreview = useCallback((assets: ImagePicker.ImagePickerAsset[]) => {
    setStagedMediaAssets(assets);
    setMediaPreviewVisible(true);
  }, []);

  const closeMediaPreview = useCallback(() => {
    setMediaPreviewVisible(false);
    setStagedMediaAssets([]);
  }, []);

  // Pick photos / videos from gallery
  const handlePickMedia = useCallback(async () => {
    if (isPickingActiveRef.current) return;
    isPickingActiveRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow media library access to send attachments.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setStagedMediaAssets(result.assets);
        setMediaPreviewVisible(true);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) return;
      Alert.alert('Media Error', msg);
    } finally {
      setTimeout(() => {
        isPickingActiveRef.current = false;
      }, 400);
    }
  }, []);

  // Capture photo / video using camera
  const handleLaunchCamera = useCallback(async () => {
    if (isPickingActiveRef.current) return;
    isPickingActiveRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setStagedMediaAssets(result.assets);
        setMediaPreviewVisible(true);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) return;
      Alert.alert('Camera Error', msg);
    } finally {
      setTimeout(() => {
        isPickingActiveRef.current = false;
      }, 400);
    }
  }, []);

  // Send document helper
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

  // Pick document from filesystem
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
  }, [handleSendDocument]);

  // Send staged media from preview modal
  const handleSendStagedMedia = useCallback(async (assets: ImagePicker.ImagePickerAsset[], caption: string) => {
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
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, onMediaSent]);

  // Send voice note
  const handleSendVoiceNote = useCallback(async (duration: number, audioUri?: string) => {
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

  return {
    stagedMediaAssets,
    mediaPreviewVisible,
    isUploadingMedia,
    mediaViewerUrl,
    mediaViewerKind,
    mediaViewerVisible,
    openMediaViewer,
    closeMediaViewer,
    openMediaPreview,
    closeMediaPreview,
    handlePickMedia,
    handleLaunchCamera,
    handlePickDocument,
    handleSendDocument,
    handleSendStagedMedia,
    handleSendVoiceNote,
  };
}
