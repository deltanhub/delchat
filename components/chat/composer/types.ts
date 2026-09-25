import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ChatAttachmentActionType =
  | 'media'
  | 'photo'
  | 'document'
  | 'catalog'
  | 'form'
  | 'lead'
  | 'assign-agent'
  | 'embed';

export interface ReplyingMessageData {
  id: string;
  authorName: string;
  body: string;
}

export interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendVoiceNote?: (duration: number, audioUri?: string) => void;
  onSelectAttachment?: (type: ChatAttachmentActionType) => void;
  canAssignAgent?: boolean;
  replyingToMessage?: ReplyingMessageData | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  disabledNotice?: string;
}

export interface AudioRecordingState {
  isRecording: boolean;
  recordingSeconds: number;
  handleStartRecording: () => Promise<void>;
  handleStopRecording: (send: boolean) => Promise<void>;
  formatRecordTime: (sec: number) => string;
}

export interface AttachmentOptionItem {
  key: ChatAttachmentActionType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  lightBg: string;
  darkBg: string;
  lightColor: string;
  darkColor: string;
  visible?: boolean;
}

export interface ComposerAttachmentMenuProps {
  visible: boolean;
  canAssignAgent?: boolean;
  isDark: boolean;
  bottomOffset: number;
  onSelect: (type: ChatAttachmentActionType) => void;
  onClose: () => void;
}

export interface ComposerReplyBannerProps {
  replyingToMessage: ReplyingMessageData;
  isDark: boolean;
  primaryColor: string;
  placeholderColor: string;
  onCancelReply?: () => void;
}

export interface ComposerRecordingBarProps {
  recordingSeconds: number;
  textColor: string;
  primaryColor: string;
  formatRecordTime: (sec: number) => string;
  onCancelRecording: () => void;
  onSendRecording: () => void;
}

export interface ComposerInputBarProps {
  value: string;
  isDark: boolean;
  showAttachmentMenu: boolean;
  primaryColor: string;
  primarySoftColor: string;
  textInputRef: React.RefObject<TextInput | null>;
  onChangeText: (text: string) => void;
  onToggleAttachmentMenu: () => void;
  onSendPress: () => void;
  onStartRecording: () => void;
}

export interface ComposerDisabledBannerProps {
  isDark: boolean;
  borderColor: string;
  bottomPadding: number;
  disabledNotice?: string;
}
