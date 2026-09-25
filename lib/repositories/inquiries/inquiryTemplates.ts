import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';
import type { ChatInquiryTemplate, ChatInquiryTemplateField, FormTrigger } from './types';

/**
 * Fetches inquiry form templates (Tour Request & General Inquiry) and their fields.
 */
export async function fetchInquiryTemplates(): Promise<ChatInquiryTemplate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: templates } = await supabase
      .from('chat_inquiry_templates')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true });

    if (!templates || templates.length === 0) return [];
    const templateIds = templates.map((t) => t.id);

    const { data: fields } = await supabase
      .from('chat_inquiry_template_fields')
      .select('*')
      .in('template_id', templateIds)
      .order('sort_order', { ascending: true });

    const fieldsByTemplate = new Map<string, ChatInquiryTemplateField[]>();
    (fields || []).forEach((f) => {
      const arr = fieldsByTemplate.get(f.template_id) || [];
      arr.push({
        id: f.id,
        templateId: f.template_id,
        fieldName: f.field_name,
        fieldLabel: f.field_label,
        fieldType: f.field_type,
        options: Array.isArray(f.options) ? f.options : null,
        isRequired: f.is_required,
        sortOrder: f.sort_order,
      });
      fieldsByTemplate.set(f.template_id, arr);
    });

    return templates.map((t) => ({
      id: t.id,
      ownerUserId: t.owner_user_id,
      intentTrigger: t.intent_trigger as 'tour' | 'question' | 'manual',
      title: t.title,
      description: t.description,
      isActive: t.is_active,
      fields: fieldsByTemplate.get(t.id) || [],
    }));
  } catch (err) {
    console.warn('[inquiriesRepository] Direct DB template fetch failed, trying API fallback:', err);
  }

  try {
    const data = await fetchWithAuth('/api/dashboard/inquiry-templates');
    if (data && Array.isArray(data.templates)) {
      return data.templates as ChatInquiryTemplate[];
    }
  } catch (apiErr) {
    console.warn('[inquiriesRepository] API endpoint fallback for templates failed:', apiErr);
  }

  return [];
}

/**
 * Creates a template record if it does not already exist.
 */
export async function ensureTemplate(
  trigger: FormTrigger,
  title: string,
  description?: string
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await supabase
      .from('chat_inquiry_templates')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('intent_trigger', trigger)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const { data: created } = await supabase
      .from('chat_inquiry_templates')
      .insert({
        owner_user_id: user.id,
        intent_trigger: trigger,
        title,
        description: description || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (created?.id) return created.id;
  } catch (err) {
    console.warn('[inquiriesRepository] Direct DB ensureTemplate failed, trying API fallback:', err);
  }

  try {
    const res = await fetchWithAuth('/api/dashboard/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify({ intentTrigger: trigger, title, description: description || null }),
    });
    if (res?.id) return res.id;
  } catch {}

  return null;
}

/**
 * Updates template metadata (title, description, isActive).
 */
export async function updateTemplateMeta(
  templateId: string,
  patch: { title?: string; description?: string | null; isActive?: boolean }
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;

  const { error } = await supabase.from('chat_inquiry_templates').update(dbPatch).eq('id', templateId);

  if (error) {
    console.warn('[inquiriesRepository] Direct DB updateTemplateMeta failed, trying API fallback:', error);
    try {
      await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      return;
    } catch {}
    throw error;
  }
}
