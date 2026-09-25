import { EdgeInsets } from 'react-native-safe-area-context';
import { ChatConversation } from '../chat/ConversationRow';
import type { MuteDuration } from '../../lib/repositories/conversationRepository';

export interface ArchivedHeaderProps {
  insets: EdgeInsets;
  accentColor: string;
  colors: any;
  isDark: boolean;
  onBack: () => void;
}

export interface ArchivedSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  colors: any;
  isDark: boolean;
}

export interface ArchivedEmptyStateProps {
  searchQuery: string;
  colors: any;
}

export interface ArchivedInfoBannerProps {
  colors: any;
  isDark: boolean;
}

export interface ArchivedModalsHostProps {
  actionModalVisible: boolean;
  actionModalConv: ChatConversation | null;
  currentUserId?: string;
  onCloseActionModal: () => void;
  onOpenConversation: (id: string) => void;
  onToggleArchive: (id: string, cur: boolean) => void;
  onToggleMute: (id: string, cur: boolean) => void;
  onMarkReadToggle: (id: string, cur: boolean) => void;
  onTogglePin: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearConversation: (id: string) => void;
  onBlockUser: (conv: ChatConversation) => void;
  onToggleFavorite: (id: string, cur: boolean) => void;
  muteModalVisible: boolean;
  onCloseMuteModal: () => void;
  onSelectMuteDuration: (duration: MuteDuration) => void;
}
