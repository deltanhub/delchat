import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';
import type { ChatInquiryTemplateField } from './types';

/**
 * Adds a new field to an inquiry template.
 */
export async function createTemplateField(
  templateId: string,
  field: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>
): Promise<ChatInquiryTemplateField | null> {
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

  if (!error && inserted) {
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
  }

  console.warn('[inquiriesRepository] Direct DB createTemplateField failed, trying API fallback:', error);
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

  throw error || new Error('Failed to insert field');
}

/**
 * Updates an existing field on a template.
 */
export async function updateTemplateField(
  templateId: string,
  fieldId: string,
  patch: Partial<ChatInquiryTemplateField>
): Promise<void> {
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

  if (error) {
    console.warn('[inquiriesRepository] Direct DB updateTemplateField failed, trying API fallback:', error);
    try {
      await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}/fields/${fieldId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      return;
    } catch {}
    throw error;
  }
}

/**
 * Deletes a field from a template.
 */
export async function deleteTemplateField(templateId: string, fieldId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_inquiry_template_fields')
    .delete()
    .eq('id', fieldId);

  if (error) {
    console.warn('[inquiriesRepository] Direct DB deleteTemplateField failed, trying API fallback:', error);
    try {
      await fetchWithAuth(`/api/dashboard/inquiry-templates/${templateId}/fields/${fieldId}`, {
        method: 'DELETE',
      });
      return;
    } catch {}
    throw error;
  }
}
