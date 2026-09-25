export interface Contact {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  mainRole: string;
  subtitle?: string;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
}

export type ComposeMode = 'direct' | 'group';
export type ComposeStep = 'members' | 'info';

export interface ComposeHeaderProps {
  step: ComposeStep;
  isDark: boolean;
  colors: any;
  topInset: number;
  onBack: () => void;
}

export interface ComposeModeToggleProps {
  mode: ComposeMode;
  onModeChange: (mode: ComposeMode) => void;
  colors: any;
  isDark?: boolean;
}

export interface ComposeSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  isDark: boolean;
  colors: any;
  placeholder?: string;
}

export interface ComposeSelectedChipsProps {
  selectedContacts: Contact[];
  onRemoveContact: (contact: Contact) => void;
  colors: any;
}

export interface ComposeContactCardProps {
  contact: Contact;
  mode: ComposeMode;
  isSelected: boolean;
  colors: any;
  onPress: () => void;
}

export interface ComposeGroupInfoViewProps {
  groupName: string;
  onChangeGroupName: (name: string) => void;
  selectedContacts: Contact[];
  isSubmitting: boolean;
  colors: any;
  onCreateGroup: () => void;
}

export interface ComposeEmptyStateProps {
  isSearching: boolean;
  searchError: string | null;
  searchValue: string;
  colors: any;
}
