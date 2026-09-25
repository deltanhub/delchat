import { useState, useEffect, useCallback, useMemo } from 'react';
import { inquiriesRepository } from '../../lib/repositories';
import type {
  ChatInquiryTemplate,
  InquiryResponseItem,
  FormTrigger,
  FormFilter,
} from '../../types/inquiries';
import {
  DEFAULT_TEMPLATES,
  useInquiryTemplatesMutations,
  useInquiryFieldsMutations,
} from './data';

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

  const filteredResponses = useMemo(() => {
    if (responseFilter === 'all') return responses;
    return responses.filter((r) => r.intentTrigger === responseFilter);
  }, [responses, responseFilter]);

  const { toggleActive, saveTemplateMeta } = useInquiryTemplatesMutations(templates, setTemplates);
  const { addField, updateField, deleteField, reorderField } = useInquiryFieldsMutations(templates, setTemplates);

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
