import { useState, useEffect } from 'react';
import type {
  ChatInquiryTemplateField,
  InquiryTemplateFieldType,
} from '../../../types/inquiries';

interface UseInquiryFieldFormParams {
  initialField: ChatInquiryTemplateField | null;
  visible: boolean;
  onSave: (fieldData: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>) => void;
  onClose: () => void;
}

export function useInquiryFieldForm({
  initialField,
  visible,
  onSave,
  onClose,
}: UseInquiryFieldFormParams) {
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<InquiryTemplateFieldType>('text');
  const [optionsText, setOptionsText] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (initialField) {
      setFieldLabel(initialField.fieldLabel);
      setFieldType(initialField.fieldType);
      setOptionsText(initialField.options ? initialField.options.join(', ') : '');
      setIsRequired(initialField.isRequired);
    } else {
      setFieldLabel('');
      setFieldType('text');
      setOptionsText('');
      setIsRequired(false);
    }
  }, [initialField, visible]);

  const handleSave = () => {
    if (!fieldLabel.trim()) return;

    const fieldName = fieldLabel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 50);

    const options =
      fieldType === 'select'
        ? optionsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    onSave({
      fieldLabel: fieldLabel.trim(),
      fieldName: fieldName || 'custom_field',
      fieldType,
      options,
      isRequired,
      sortOrder: initialField?.sortOrder ?? 0,
    });
    onClose();
  };

  return {
    fieldLabel,
    setFieldLabel,
    fieldType,
    setFieldType,
    optionsText,
    setOptionsText,
    isRequired,
    setIsRequired,
    handleSave,
  };
}
