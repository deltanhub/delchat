import { ManualLeadItem } from '../types';

export interface ManualLeadsCounts {
  total: number;
  new: number;
  active: number;
  viewing: number;
  closedOrLost: number;
}

export interface ManualLeadsViewProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  manualLeads: ManualLeadItem[];
  manualCounts: ManualLeadsCounts;
  onOpenAddLead: () => void;
  onSelectLead: (lead: ManualLeadItem) => void;
}

export interface ManualLeadMetricGridProps {
  manualCounts: ManualLeadsCounts;
  colors: any;
}

export interface ManualLeadActionBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onOpenAddLead: () => void;
  colors: any;
  isDark: boolean;
}

export interface ManualLeadFilterPillsProps {
  manualFilterStatus: string;
  onSelectStatus: (status: string) => void;
  manualLeads: ManualLeadItem[];
  colors: any;
}

export interface ManualLeadCardProps {
  lead: ManualLeadItem;
  onSelectLead: (lead: ManualLeadItem) => void;
  colors: any;
  isDark: boolean;
}

export interface ManualLeadsEmptyStateProps {
  colors: any;
}
