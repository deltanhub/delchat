export interface InquiryFormField {
  id?: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  isRequired?: boolean;
}

export interface SelectedInquiryTemplate {
  templateId: string;
  templateTitle: string;
  fields: InquiryFormField[];
}

export interface InquiryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SelectedInquiryTemplate) => void;
}

export interface InquiryFormHeaderProps {
  onClose: () => void;
  textColor: string;
  placeholderColor: string;
  isDark: boolean;
}

export interface InquiryFormEmptyStateProps {
  textColor: string;
  placeholderColor: string;
}

export interface InquiryTemplateCardProps {
  item: SelectedInquiryTemplate;
  onSelect: (item: SelectedInquiryTemplate) => void;
  textColor: string;
  placeholderColor: string;
  primaryColor: string;
  primarySoftColor: string;
  isDark: boolean;
}

export interface InquiryFormLegalNoticeProps {
  primaryColor: string;
  isDark: boolean;
}
