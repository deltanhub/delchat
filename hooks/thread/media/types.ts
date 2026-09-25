import type * as ImagePicker from 'expo-image-picker';
import type * as DocumentPicker from 'expo-document-picker';

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

export type MediaViewerKind = 'image' | 'video';
