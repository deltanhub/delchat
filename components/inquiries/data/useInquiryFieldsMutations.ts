import { useCallback } from 'react';
import { Alert } from 'react-native';
import { inquiriesRepository } from '../../../lib/repositories';
import type { ChatInquiryTemplate, ChatInquiryTemplateField, FormTrigger } from '../../../types/inquiries';
import { DEFAULT_TEMPLATES } from './constants';

export function useInquiryFieldsMutations(
  templates: ChatInquiryTemplate[],
  setTemplates: React.Dispatch<React.SetStateAction<ChatInquiryTemplate[]>>
) {
  const addField = useCallback(
    async (
      trigger: FormTrigger,
      fieldData: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>
    ) => {
      try {
        let tpl = templates.find((t) => t.intentTrigger === trigger);
        let tplId = tpl?.id;
        if (!tplId) {
          tplId = (await inquiriesRepository.ensureTemplate(
            trigger,
            DEFAULT_TEMPLATES[trigger].title,
            DEFAULT_TEMPLATES[trigger].description
          )) || '';
        }
        if (!tplId) return false;

        const created = await inquiriesRepository.createTemplateField(tplId, fieldData);
        if (!created) return false;

        setTemplates((prev) =>
          prev.map((t) => (t.id === tplId ? { ...t, fields: [...t.fields, created] } : t))
        );
        return true;
      } catch (err) {
        Alert.alert('Error', 'Failed to add form field.');
        return false;
      }
    },
    [templates, setTemplates]
  );

  const updateField = useCallback(
    async (
      trigger: FormTrigger,
      fieldId: string,
      patch: Partial<ChatInquiryTemplateField>
    ) => {
      try {
        const tpl = templates.find((t) => t.intentTrigger === trigger);
        if (!tpl?.id) return false;

        await inquiriesRepository.updateTemplateField(tpl.id, fieldId, patch);
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === tpl.id
              ? {
                  ...t,
                  fields: t.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
                }
              : t
          )
        );
        return true;
      } catch (err) {
        Alert.alert('Error', 'Failed to update field.');
        return false;
      }
    },
    [templates, setTemplates]
  );

  const deleteField = useCallback(
    async (trigger: FormTrigger, fieldId: string) => {
      try {
        const tpl = templates.find((t) => t.intentTrigger === trigger);
        if (!tpl?.id) return false;

        await inquiriesRepository.deleteTemplateField(tpl.id, fieldId);
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === tpl.id
              ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
              : t
          )
        );
        return true;
      } catch (err) {
        Alert.alert('Error', 'Failed to delete field.');
        return false;
      }
    },
    [templates, setTemplates]
  );

  const reorderField = useCallback(
    async (trigger: FormTrigger, fieldId: string, direction: 'up' | 'down') => {
      const tpl = templates.find((t) => t.intentTrigger === trigger);
      if (!tpl?.id || tpl.fields.length < 2) return false;

      const idx = tpl.fields.findIndex((f) => f.id === fieldId);
      if (idx === -1) return false;
      if (direction === 'up' && idx === 0) return false;
      if (direction === 'down' && idx === tpl.fields.length - 1) return false;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const newFields = [...tpl.fields];
      const temp = newFields[idx];
      newFields[idx] = newFields[targetIdx];
      newFields[targetIdx] = temp;

      const updatedFields = newFields.map((f, i) => ({ ...f, sortOrder: i }));
      setTemplates((prev) =>
        prev.map((t) => (t.id === tpl.id ? { ...t, fields: updatedFields } : t))
      );

      try {
        await Promise.all(
          updatedFields.map((f) =>
            inquiriesRepository.updateTemplateField(tpl.id, f.id, { sortOrder: f.sortOrder })
          )
        );
        return true;
      } catch {
        return false;
      }
    },
    [templates, setTemplates]
  );

  return { addField, updateField, deleteField, reorderField };
}
