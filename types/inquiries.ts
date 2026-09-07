export type InquiryTemplateFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean'
  | 'schedule_call';

export interface ChatInquiryTemplateField {
  id: string;
  templateId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: InquiryTemplateFieldType;
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface ChatInquiryTemplate {
  id: string;
  ownerUserId: string;
  intentTrigger: 'tour' | 'question' | 'manual';
  title: string;
  description: string | null;
  isActive: boolean;
  fields: ChatInquiryTemplateField[];
}

export interface InquiryResponseAnswer {
  label: string;
  value: string | boolean;
}

export interface InquiryResponseItem {
  id: string;
  conversationId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  listingTitle: string;
  createdAt: string;
  templateTitle: string;
  intentTrigger: 'tour' | 'question' | string | null;
  answers: InquiryResponseAnswer[];
}

export type FormTrigger = 'tour' | 'question';
export type FormFilter = 'all' | 'tour' | 'question';
export type InquiryMainTab = 'responses' | 'builder';

export const FIELD_TYPE_LABELS: Record<InquiryTemplateFieldType, string> = {
  text: 'Short text',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown select',
  boolean: 'Yes / No',
  schedule_call: 'Schedule call (Date & Time)',
};

export const TRIGGER_META: Record<
  FormTrigger,
  { label: string; subtitle: string; badge: string; badgeColor: string }
> = {
  tour: {
    label: 'Tour Request Form',
    subtitle: 'Shown when a buyer clicks "Request a Tour" on a listing.',
    badge: 'Trigger: Request a Tour',
    badgeColor: '#dbeafe',
  },
  question: {
    label: 'General Inquiry Form',
    subtitle: 'Publisher can insert this form mid-chat.',
    badge: 'Trigger: Ask a Question',
    badgeColor: '#fdf6f8',
  },
};
