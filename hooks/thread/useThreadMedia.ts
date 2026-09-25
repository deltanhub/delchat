import { useRef } from 'react';
import {
  UseThreadMediaParams,
  useMediaViewerState,
  useStagedMediaState,
  useMediaPickerActions,
  useDocumentPickerActions,
  useStagedMediaSend,
  useVoiceNoteSend,
} from './media';

export type { UseThreadMediaParams } from './media';

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
  const staged = useStagedMediaState();

  // Fullscreen media viewer state
  const viewer = useMediaViewerState();

  // Pick photos / videos from gallery or camera
  const picker = useMediaPickerActions(isPickingActiveRef, staged.openMediaPreview);

  // Pick and send documents
  const doc = useDocumentPickerActions(
    conversationId,
    currentUser,
    partnerUserId,
    ensureParticipantAuthorization,
    isPickingActiveRef,
    onMediaSent
  );

  // Send staged media from preview modal
  const handleSendStagedMedia = useStagedMediaSend(
    conversationId,
    currentUser,
    partnerUserId,
    ensureParticipantAuthorization,
    staged.setIsUploadingMedia,
    staged.setMediaPreviewVisible,
    staged.setStagedMediaAssets,
    onMediaSent
  );

  // Send voice note with offline outbox queue fallback
  const handleSendVoiceNote = useVoiceNoteSend(
    conversationId,
    currentUser,
    partnerUserId,
    ensureParticipantAuthorization,
    onAddOptimisticMessage,
    onUpdateOptimisticMessage,
    onRemoveOptimisticMessage,
    onMediaSent
  );

  return {
    stagedMediaAssets: staged.stagedMediaAssets,
    mediaPreviewVisible: staged.mediaPreviewVisible,
    isUploadingMedia: staged.isUploadingMedia,
    mediaViewerUrl: viewer.mediaViewerUrl,
    mediaViewerKind: viewer.mediaViewerKind,
    mediaViewerVisible: viewer.mediaViewerVisible,
    openMediaViewer: viewer.openMediaViewer,
    closeMediaViewer: viewer.closeMediaViewer,
    openMediaPreview: staged.openMediaPreview,
    closeMediaPreview: staged.closeMediaPreview,
    handlePickMedia: picker.handlePickMedia,
    handleLaunchCamera: picker.handleLaunchCamera,
    handlePickDocument: doc.handlePickDocument,
    handleSendDocument: doc.handleSendDocument,
    handleSendStagedMedia,
    handleSendVoiceNote,
  };
}
