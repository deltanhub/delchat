import type {
  InquiryResponseItem,
  FormFilter,
} from '../../../types/inquiries';

export interface InquiryResponsesViewProps {
  responses: InquiryResponseItem[];
  totalCount: number;
  tourCount: number;
  questionCount: number;
  activeFilter: FormFilter;
  onSelectFilter: (filter: FormFilter) => void;
  onOpenChat: (conversationId: string) => void;
}

export interface InquiryMetricCardProps {
  totalCount: number;
  isDark: boolean;
}

export interface InquiryFilterBarProps {
  filterOptions: Array<{ key: FormFilter; label: string; count: number }>;
  activeFilter: FormFilter;
  onSelectFilter: (filter: FormFilter) => void;
  isDark: boolean;
}

export interface InquiryResponseCardProps {
  item: InquiryResponseItem;
  isDark: boolean;
  onOpenChat: (conversationId: string) => void;
}
