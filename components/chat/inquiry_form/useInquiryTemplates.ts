import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import * as Haptics from '../../../lib/haptics';
import { SelectedInquiryTemplate } from './types';

interface UseInquiryTemplatesParams {
  visible: boolean;
  onSelectTemplate: (template: SelectedInquiryTemplate) => void;
  onClose: () => void;
}

export function useInquiryTemplates({
  visible,
  onSelectTemplate,
  onClose,
}: UseInquiryTemplatesParams) {
  const [templates, setTemplates] = useState<SelectedInquiryTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tmplRows, error } = await supabase
        .from('chat_inquiry_templates')
        .select(`
          id, title, description, intent_trigger,
          fields:chat_inquiry_template_fields (
            field_name, field_label, field_type, options, is_required, sort_order
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && tmplRows) {
        const mapped: SelectedInquiryTemplate[] = tmplRows.map((t: any) => ({
          templateId: t.id,
          templateTitle: t.title,
          fields: (t.fields || [])
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((f: any) => ({
              fieldName: f.field_name,
              fieldLabel: f.field_label,
              fieldType: f.field_type,
              options: Array.isArray(f.options) ? f.options : undefined,
              isRequired: f.is_required,
            })),
        }));
        setTemplates(mapped);
      } else {
        setTemplates([]);
      }
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible, fetchTemplates]);

  const handleSelect = (tmpl: SelectedInquiryTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectTemplate(tmpl);
    onClose();
  };

  return {
    templates,
    loading,
    fetchTemplates,
    handleSelect,
  };
}
