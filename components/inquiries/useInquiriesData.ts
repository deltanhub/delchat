import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { inquiriesRepository } from '../../lib/repositories';
import type {
  ChatInquiryTemplate,
  ChatInquiryTemplateField,
  InquiryResponseItem,
  FormTrigger,
  FormFilter,
} from '../../types/inquiries';

const DEFAULT_TEMPLATES: Record<FormTrigger, { title: string; description: string }> = {
  tour: {
    title: 'Tour Request Form',
    description: 'Please share your preferences so we can schedule your viewing.',
  },
  question: {
    title: 'General Inquiry Form',
    description: 'Let us know your requirements before we start chatting.',
  },
};

export function useInquiriesData() {
  const [templates, setTemplates] = useState<ChatInquiryTemplate[]>([]);
  const [responses, setResponses] = useState<InquiryResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<FormTrigger>('tour');
  const [responseFilter, setResponseFilter] = useState<FormFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const [tpls, resps] = await Promise.all([
        inquiriesRepository.fetchInquiryTemplates(),
        inquiriesRepository.fetchInquiryResponses(),
      ]);
      setTemplates(tpls);
      setResponses(resps);
    } catch (err) {
      console.warn('[useInquiriesData] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // Current active template being edited in the form builder
  const currentTemplate = useMemo(() => {
    const existing = templates.find((t) => t.intentTrigger === selectedTrigger);
    if (existing) return existing;
    return {
      id: '',
      ownerUserId: '',
      intentTrigger: selectedTrigger,
      title: DEFAULT_TEMPLATES[selectedTrigger].title,
      description: DEFAULT_TEMPLATES[selectedTrigger].description,
      isActive: true,
      fields: [],
    };
  }, [templates, selectedTrigger]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    if (responseFilter === 'all') return responses;
    return responses.filter((r) => r.intentTrigger === responseFilter);
  }, [responses, responseFilter]);

  // Toggle active status
  const toggleActive = useCallback(
    async (trigger: FormTrigger) => {
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

        const newActiveState = !(tpl?.isActive ?? true);
        await inquiriesRepository.updateTemplateMeta(tplId, { isActive: newActiveState });

        setTemplates((prev) => {
          const idx = prev.findIndex((t) => t.intentTrigger === trigger);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], isActive: newActiveState };
            return next;
          }
          return [
            ...prev,
            {
              id: tplId!,
              ownerUserId: '',
              intentTrigger: trigger,
              title: DEFAULT_TEMPLATES[trigger].title,
              description: DEFAULT_TEMPLATES[trigger].description,
              isActive: newActiveState,
              fields: [],
            },
          ];
        });
        return true;
      } catch (err) {
        Alert.alert('Error', 'Failed to update active state.');
        return false;
      }
    },
    [templates]
  );

  // Save template title and description
  const saveTemplateMeta = useCallback(
    async (trigger: FormTrigger, title: string, description: string) => {
      try {
        let tpl = templates.find((t) => t.intentTrigger === trigger);
        let tplId = tpl?.id;
        if (!tplId) {
          tplId = (await inquiriesRepository.ensureTemplate(trigger, title, description)) || '';
        }
        if (!tplId) return false;

        await inquiriesRepository.updateTemplateMeta(tplId, { title, description });
        setTemplates((prev) =>
          prev.map((t) => (t.id === tplId ? { ...t, title, description } : t))
        );
        return true;
      } catch (err) {
        Alert.alert('Error', 'Failed to save template details.');
        return false;
      }
    },
    [templates]
  );

  // Add field
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
    [templates]
  );

  // Update field
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
    [templates]
  );

  // Delete field
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
    [templates]
  );

  // Reorder field
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

      // Update sort orders
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
    [templates]
  );

  return {
    templates,
    responses,
    filteredResponses,
    currentTemplate,
    loading,
    refreshing,
    selectedTrigger,
    setSelectedTrigger,
    responseFilter,
    setResponseFilter,
    onRefresh,
    toggleActive,
    saveTemplateMeta,
    addField,
    updateField,
    deleteField,
    reorderField,
  };
}
