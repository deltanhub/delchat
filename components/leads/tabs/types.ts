import { MainTabType, ManualLeadItem } from '../types';
import type { InquiryMainTab } from '../../../types/inquiries';

export type CrmSection = 'leads' | 'inquiries';

export interface LeadsHeaderProps {
  activeSection: CrmSection;
  activeLeadsTab: MainTabType;
  activeInquiriesTab: InquiryMainTab;
  totalLeadsCount: number;
  chatLeadsCount: number;
  manualLeadsCount: number;
  inquiriesCount: number;
  isDark: boolean;
  topInset: number;
  onRefresh: () => void;
  onSelectSection: (section: CrmSection) => void;
  onSelectLeadsTab: (tab: MainTabType) => void;
  onSelectInquiriesTab: (tab: InquiryMainTab) => void;
}

export interface LeadsRestrictedViewProps {
  onReturnToInbox: () => void;
  isDark: boolean;
}

export interface LeadsModalsHostProps {
  addLeadModalVisible: boolean;
  isSubmittingForm: boolean;
  onCloseAddModal: () => void;
  onSubmitAddLead: (data: any) => Promise<boolean>;
  detailModalVisible: boolean;
  selectedManualLead: ManualLeadItem | null;
  isSavingNotes: boolean;
  onCloseDetailModal: () => void;
  onSaveNotes: (notes: string) => Promise<void>;
  onUpdateStatus: (status: ManualLeadItem['status']) => void;
}
