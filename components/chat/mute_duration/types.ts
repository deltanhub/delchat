import type { MuteDuration } from '../../../lib/repositories/conversationRepository';

export type { MuteDuration };

export interface MuteDurationOption {
  key: MuteDuration;
  label: string;
  icon: string;
  subtitle: string;
}

export interface MuteDurationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (duration: MuteDuration) => void;
}

export interface MuteDurationHeaderProps {
  textColor: string;
  primaryColor: string;
  isDark: boolean;
}

export interface MuteDurationOptionsListProps {
  onSelect: (duration: MuteDuration) => void;
  textColor: string;
  primaryColor: string;
  isDark: boolean;
}

export interface MuteDurationCancelButtonProps {
  onClose: () => void;
  textColor: string;
  isDark: boolean;
}
