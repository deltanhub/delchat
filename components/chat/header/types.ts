import type { GestureResponderEvent } from 'react-native';

export type PresenceStatus = 'available' | 'busy' | 'away';

export interface ChatHeaderProps {
  partnerName: string;
  partnerAvatarUrl: string | null;
  subtitle: string;
  isTyping: boolean;
  isOnline?: boolean;
  lastSeenText?: string | null;
  canSendMessages: boolean;
  onBack: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onAddAsLead?: () => void;
  onToggleArchive?: () => void;
  onOpenChatInfo?: () => void;
  onToggleMute?: () => void;
  onToggleBlock?: () => void;
  onReportAgent?: () => void;
  onManageAssignment?: () => void;
  onViewStarred?: () => void;
  onOpenInternalNotes?: () => void;
  presenceStatus?: PresenceStatus;
  isArchived?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  hasAssignment?: boolean;
  canManageAssignment?: boolean;
  canReportAgent?: boolean;
  isGroup?: boolean;
  participantCount?: number;
  participantNames?: string[];
}

export interface ChatHeaderLeftProps {
  partnerName: string;
  partnerAvatarUrl: string | null;
  subtitle: string;
  isTyping: boolean;
  isOnline?: boolean;
  lastSeenText?: string | null;
  presenceStatus?: PresenceStatus;
  isGroup?: boolean;
  participantCount?: number;
  participantNames?: string[];
  isDark: boolean;
  onBack: () => void;
}

export interface ChatHeaderRightProps {
  canSendMessages: boolean;
  isDark: boolean;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onOpenMenu: () => void;
}

export interface ChatHeaderDropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  topInset: number;
  isDark: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  hasAssignment?: boolean;
  canReportAgent?: boolean;
  onAddAsLead?: () => void;
  onToggleArchive?: () => void;
  onOpenChatInfo?: () => void;
  onViewStarred?: () => void;
  onOpenInternalNotes?: () => void;
  onToggleMute?: () => void;
  onManageAssignment?: () => void;
  onReportAgent?: () => void;
  onToggleBlock?: () => void;
}
