import { useCallback } from 'react';
import { Alert } from 'react-native';
import { inquiriesRepository } from '../../../lib/repositories';
import type { ChatInquiryTemplate, FormTrigger } from '../../../types/inquiries';
import { DEFAULT_TEMPLATES } from './constants';

export function useInquiryTemplatesMutations(
  templates: ChatInquiryTemplate[],
  setTemplates: React.Dispatch<React.SetStateAction<ChatInquiryTemplate[]>>
) {
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
    [templates, setTemplates]
  );

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
    [templates, setTemplates]
  );

  return { toggleActive, saveTemplateMeta };
}
