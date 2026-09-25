import { SupabaseClient } from '@supabase/supabase-js';
import { ManualLeadItem } from '../types';

export interface CreateManualLeadFormData {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  status: ManualLeadItem['status'];
  propertyType: string;
  propertyStatus: string;
  priceFrom: string;
  priceTo: string;
  bedrooms: string;
  bathrooms: string;
  message: string;
}

function mapRowToManualLead(m: any): ManualLeadItem {
  return {
    id: m.id,
    contactName: m.contact_name || 'Contact',
    contactEmail: m.contact_email,
    contactPhone: m.contact_phone,
    source: m.source || 'Dashboard lead',
    status: (m.entry_status as ManualLeadItem['status']) || 'new',
    propertyType: m.property_type,
    propertyStatus: m.property_status,
    propertyLabel: m.property_label,
    priceFrom: m.price_from,
    priceTo: m.price_to,
    bedrooms: m.bedrooms,
    bathrooms: m.bathrooms,
    message: m.message,
    notes: m.metadata?.note || m.message || null,
    createdAt: m.created_at,
  };
}

export async function fetchManualCrmLeads(
  supabase: SupabaseClient,
  userId: string
): Promise<ManualLeadItem[]> {
  const { data, error } = await supabase
    .from('dashboard_crm_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_type', 'lead')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRowToManualLead);
}

export function computeManualCounts(manualLeads: ManualLeadItem[]) {
  const counts = { total: manualLeads.length, new: 0, active: 0, viewing: 0, closedOrLost: 0 };
  for (const l of manualLeads) {
    if (l.status === 'new') counts.new++;
    if (['new', 'contacted', 'viewing-scheduled', 'negotiating'].includes(l.status)) counts.active++;
    if (l.status === 'viewing-scheduled') counts.viewing++;
    if (['closed', 'lost'].includes(l.status)) counts.closedOrLost++;
  }
  return counts;
}

export async function insertManualCrmLead(
  supabase: SupabaseClient,
  userId: string,
  formData: CreateManualLeadFormData
): Promise<ManualLeadItem> {
  const pFrom = formData.priceFrom.trim() ? Number(formData.priceFrom) : null;
  const pTo = formData.priceTo.trim() ? Number(formData.priceTo) : null;
  const beds = formData.bedrooms.trim() ? Number(formData.bedrooms) : null;
  const baths = formData.bathrooms.trim() ? Number(formData.bathrooms) : null;

  const { data, error } = await supabase
    .from('dashboard_crm_entries')
    .insert({
      user_id: userId,
      entry_type: 'lead',
      contact_name: formData.contactName.trim(),
      contact_email: formData.contactEmail.trim() || null,
      contact_phone: formData.contactPhone.trim() || null,
      source: formData.source,
      entry_status: formData.status,
      property_type: formData.propertyType,
      property_status: formData.propertyStatus,
      price_from: pFrom,
      price_to: pTo,
      bedrooms: beds,
      bathrooms: baths,
      message: formData.message.trim() || null,
      metadata: formData.message.trim() ? { note: formData.message.trim() } : {},
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToManualLead(data);
}

export async function updateManualCrmLeadNotes(
  supabase: SupabaseClient,
  leadId: string,
  notesText: string
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_crm_entries')
    .update({ metadata: { note: notesText }, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw error;
}

export async function updateManualCrmLeadStatus(
  supabase: SupabaseClient,
  leadId: string,
  nextStatus: ManualLeadItem['status']
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_crm_entries')
    .update({ entry_status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw error;
}
