import { ManualLeadItem } from '../types';

export interface LeadDetailNotesModalProps {
  visible: boolean;
  onClose: () => void;
  lead: ManualLeadItem | null;
  onUpdateStatus: (nextStatus: ManualLeadItem['status']) => void;
  onSaveNotes: (notes: string) => Promise<void>;
  isSavingNotes: boolean;
}

export interface LeadDetailHeaderProps {
  onClose: () => void;
  textColor: string;
}

export interface LeadDetailContactActionsProps {
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface LeadDetailPropertyCardProps {
  propertyType?: string | null;
  propertyStatus?: string | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  textColor: string;
  borderColor: string;
  primaryColor: string;
  isDark: boolean;
}

export interface LeadDetailStageSelectorProps {
  currentStatus: ManualLeadItem['status'];
  onUpdateStatus: (nextStatus: ManualLeadItem['status']) => void;
  textColor: string;
  borderColor: string;
  primaryColor: string;
}

export interface LeadDetailNotesEditorProps {
  notesText: string;
  onChangeNotesText: (text: string) => void;
  onSaveNotes: () => void;
  isSavingNotes: boolean;
  textColor: string;
  placeholderColor: string;
  borderColor: string;
  primaryColor: string;
  isDark: boolean;
}
