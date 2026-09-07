import { supabase } from '../supabase';
import { fetchWithAuth } from '../api-client';
import type {
  ChatInquiryTemplate,
  ChatInquiryTemplateField,
  InquiryResponseItem,
  FormTrigger,
} from '../../types/inquiries';

export const inquiriesRepository = {
  /**
   * Fetches all inquiry responses submitted from chat questionnaires across
   * conversations where the current user is publisher/agent.
   */
  async fetchInquiryResponses(): Promise<InquiryResponseItem[]> {
    try {
      const data = await fetchWithAuth('/api/dashboard/inquiry-responses');
      if (data && Array.isArray(data.responses)) {
        return data.responses as InquiryResponseItem[];
      }
    } catch (apiErr) {
      console.warn('[inquiriesRepository] API endpoint fallback for responses:', apiErr);
    }

    // Direct database fallback
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!participants || participants.length === 0) return [];
      const convIds = participants.map((p) => p.conversation_id);

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, sender_user_id, structured_payload, created_at')
        .eq('message_kind', 'inquiry_response')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!messages || messages.length === 0) return [];

      const senderIds = Array.from(new Set(messages.map((m) => m.sender_user_id).filter(Boolean))) as string[];
      let profileMap = new Map<string, string>();
      if (senderIds.length > 0) {
        try {
          const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
            requested_user_ids: senderIds,
          });
          profiles?.forEach((p: { user_id: string; display_name?: string; full_name?: string }) => {
            profileMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User');
          });
        } catch {}
      }

      return messages.map((m) => {
        const payload = m.structured_payload || {};
        return {
          id: m.id,
          conversationId: m.conversation_id,
          senderName: (m.sender_user_id ? profileMap.get(m.sender_user_id) : null) || 'Prospective Buyer',
          senderAvatarUrl: null,
          listingTitle: payload.listingTitle || 'Listing Inquiry',
          createdAt: m.created_at,
          templateTitle: payload.templateTitle || 'Inquiry Form',
          intentTrigger: (payload.intentTrigger as FormTrigger) || 'tour',
          answers: Array.isArray(payload.answers) ? payload.answers : [],
        };
      });
    } catch (err) {
      console.warn('[inquiriesRepository] Failed to fetch inquiry responses:', err);
      return [];
    }
  },

  /**
   * Fetches inquiry form templates (Tour Request & General Inquiry) and their fields.
   */
  async fetchInquiryTemplates(): Promise<ChatInquiryTemplate[]> {
    try {
      const data = await fetchWithAuth('/api/dashboard/inquiry-templates');
      if (data && Array.isArray(data.templates)) {
        return data.templates as ChatInquiryTemplate[];
      }
    } catch (apiErr) {
      console.warn('[inquiriesRepository] API endpoint fallback for templates:', apiErr);
    }

    // Direct database fallback
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
      console.warn('[inquiriesRepository] Failed to fetch inquiry templates:', err);
      return [];
    }
  },

  /**
   * Creates a template record if it does not already exist.
   */
  async ensureTemplate(trigger: FormTrigger, title: string, description?: string): Promise<string | null> {
    try {
      const res = await fetchWithAuth('/api/dashboard/inquiry-templates', {
        method: 'POST',
        body: JSON.stringify({
          intentTrigger: trigger,
          title,
          description: description || null,
        }),
      });
      if (res?.id) return res.id;
    } catch {}

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

      return created?.id || null;
    } catch (err) {
      console.error('[inquiriesRepository] Failed to ensure template:', err);
      return null;
    }
  },

  /**
   * Updates template metadata (title, description, isActive).
   */
  async updateTemplateMeta(
    templateId: string,
    patch: { title?: string; description?: string | null; isActive?: boolean }
  ): Promise<void> {
    try {
      await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      return;
    } catch {}

    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;

    const { error } = await supabase
      .from('chat_inquiry_templates')
      .update(dbPatch)
      .eq('id', templateId);
    if (error) throw error;
  },

  /**
   * Adds a new field to an inquiry template.
   */
  async createTemplateField(
    templateId: string,
    field: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>
  ): Promise<ChatInquiryTemplateField | null> {
    try {
      const res = await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}/fields`, {
        method: 'POST',
        body: JSON.stringify({
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          fieldType: field.fieldType,
          options: field.options,
          isRequired: field.isRequired,
        }),
      });
      if (res?.field) {
        return {
          id: res.field.id,
          templateId,
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          fieldType: field.fieldType,
          options: field.options,
          isRequired: field.isRequired,
          sortOrder: res.field.sortOrder ?? field.sortOrder,
        };
      }
    } catch {}

    const { data: inserted, error } = await supabase
      .from('chat_inquiry_template_fields')
      .insert({
        template_id: templateId,
        field_name: field.fieldName,
        field_label: field.fieldLabel,
        field_type: field.fieldType,
        options: field.options,
        is_required: field.isRequired,
        sort_order: field.sortOrder,
      })
      .select('*')
      .single();

    if (error || !inserted) throw error || new Error('Failed to insert field');
    return {
      id: inserted.id,
      templateId,
      fieldName: inserted.field_name,
      fieldLabel: inserted.field_label,
      fieldType: inserted.field_type,
      options: inserted.options,
      isRequired: inserted.is_required,
      sortOrder: inserted.sort_order,
    };
  },

  /**
   * Updates an existing field on a template.
   */
  async updateTemplateField(
    templateId: string,
    fieldId: string,
    patch: Partial<ChatInquiryTemplateField>
  ): Promise<void> {
    try {
      await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}/fields/${fieldId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      return;
    } catch {}

    const dbPatch: Record<string, unknown> = {};
    if (patch.fieldLabel !== undefined) dbPatch.field_label = patch.fieldLabel;
    if (patch.fieldName !== undefined) dbPatch.field_name = patch.fieldName;
    if (patch.fieldType !== undefined) dbPatch.field_type = patch.fieldType;
    if (patch.options !== undefined) dbPatch.options = patch.options;
    if (patch.isRequired !== undefined) dbPatch.is_required = patch.isRequired;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;

    const { error } = await supabase
      .from('chat_inquiry_template_fields')
      .update(dbPatch)
      .eq('id', fieldId);
    if (error) throw error;
  },

  /**
   * Deletes a field from a template.
   */
  async deleteTemplateField(templateId: string, fieldId: string): Promise<void> {
    try {
      await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}/fields/${fieldId}`, {
        method: 'DELETE',
      });
      return;
    } catch {}

    const { error } = await supabase
      .from('chat_inquiry_template_fields')
      .delete()
      .eq('id', fieldId);
    if (error) throw error;
  },
};
