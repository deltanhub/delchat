import type {
  ChatInquiryTemplate,
  ChatInquiryTemplateField,
  FormTrigger,
} from '../../../types/inquiries';

export interface InquiryFormBuilderViewProps {
  template: ChatInquiryTemplate;
  selectedTrigger: FormTrigger;
  onSelectTrigger: (trigger: FormTrigger) => void;
  onToggleActive: () => void;
  onSaveMeta: (title: string, description: string) => void;
  onAddField: (field: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>) => void;
  onUpdateField: (fieldId: string, patch: Partial<ChatInquiryTemplateField>) => void;
  onDeleteField: (fieldId: string) => void;
  onReorderField: (fieldId: string, direction: 'up' | 'down') => void;
}

export interface FormBuilderTriggerCardsProps {
  selectedTrigger: FormTrigger;
  isActive: boolean;
  onSelectTrigger: (trigger: FormTrigger) => void;
  isDark: boolean;
}

export interface FormBuilderMetaCardProps {
  title: string;
  description: string;
  isActive: boolean;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onToggleActive: () => void;
  onSaveDetails: () => void;
  isDark: boolean;
}

export interface FormBuilderFieldCardProps {
  item: ChatInquiryTemplateField;
  index: number;
  totalFields: number;
  isDark: boolean;
  onReorderField: (fieldId: string, direction: 'up' | 'down') => void;
  onOpenEditModal: (field: ChatInquiryTemplateField) => void;
  onDeleteField: (fieldId: string) => void;
}

export interface FormBuilderFieldsHeaderProps {
  fieldsCount: number;
  onOpenAddModal: () => void;
}
