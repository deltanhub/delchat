import { ChatLeadItem } from '../types';

export interface ChatLeadsViewProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  chatLeads: ChatLeadItem[];
  currentUser: { id: string } | null;
  isAgencyOrDev: boolean;
  savingChatLeadId: string | null;
  onUpdateChatLeadStatus: (leadId: string, nextStatus: ChatLeadItem['status']) => void;
  onOpenConversation: (conversationId: string, partnerName: string) => void;
}

export type ChatSubTab = 'master' | 'my';

export interface ChatLeadsSubTabsProps {
  subTab: ChatSubTab;
  onSelectSubTab: (tab: ChatSubTab) => void;
  masterLeadsCount: number;
  myLeadsCount: number;
  primaryColor: string;
  placeholderColor: string;
  borderColor: string;
}

export interface ChatLeadsPipelineBarProps {
  filterStatus: string;
  onSelectStatus: (status: string) => void;
  partitionedChatLeads: ChatLeadItem[];
  primaryColor: string;
  textColor: string;
  borderColor: string;
}

export interface ChatLeadsCardProps {
  item: ChatLeadItem;
  currentUser: { id: string } | null;
  isDark: boolean;
  colors: {
    primary: string;
    border: string;
    card: string;
    text: string;
    placeholder: string;
  };
  savingChatLeadId: string | null;
  onUpdateChatLeadStatus: (leadId: string, nextStatus: ChatLeadItem['status']) => void;
  onOpenConversation: (conversationId: string, partnerName: string) => void;
}
