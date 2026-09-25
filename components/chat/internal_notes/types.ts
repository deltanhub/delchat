import { InternalNoteItem } from '../../../lib/repositories';

export type { InternalNoteItem };

export interface LeadInternalNotesModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId?: string;
  inquiryId?: string | null;
  title?: string;
}

export interface InternalNotesHeaderProps {
  title: string;
  isDark: boolean;
  onClose: () => void;
}

export interface InternalNoteCardProps {
  item: InternalNoteItem;
  isDark: boolean;
  formatDate: (isoString: string) => string;
}

export interface InternalNotesComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isDark: boolean;
}
