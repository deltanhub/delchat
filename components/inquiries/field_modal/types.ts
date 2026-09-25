import type {
  ChatInquiryTemplateField,
  InquiryTemplateFieldType,
} from '../../../types/inquiries';

export interface InquiryFieldModalProps {
  visible: boolean;
  initialField: ChatInquiryTemplateField | null;
  onClose: () => void;
  onSave: (fieldData: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>) => void;
}

export interface InquiryFieldModalHeaderProps {
  isEditing: boolean;
  textColor: string;
  borderColor: string;
  onClose: () => void;
}

export interface InquiryFieldTypeSelectorProps {
  fieldType: InquiryTemplateFieldType;
  setFieldType: (type: InquiryTemplateFieldType) => void;
  primaryColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export interface InquiryFieldOptionsInputProps {
  optionsText: string;
  setOptionsText: (text: string) => void;
  placeholderColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export interface InquiryFieldRequiredSwitchProps {
  isRequired: boolean;
  setIsRequired: (required: boolean) => void;
  textColor: string;
  placeholderColor: string;
  borderColor: string;
  primaryColor: string;
  isDark: boolean;
}

export interface InquiryFieldModalFooterProps {
  onClose: () => void;
  onSave: () => void;
  borderColor: string;
  textColor: string;
  primaryColor: string;
}
