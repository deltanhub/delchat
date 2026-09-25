import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';

/**
 * Adds an internal note to a lead.
 * Dispatches to DeltanHub Web API /api/dashboard/master-leads/${inquiryId}/notes
 * with resilient direct Supabase fallback protected by PostgreSQL RLS.
 */
export async function addInternalNote(params: {
  inquiryId: string;
  authorUserId: string;
  body: string;
  visibility?: 'company_only' | 'company_and_agent';
}): Promise<{ id: string }> {
  const { inquiryId, authorUserId, body, visibility = 'company_and_agent' } = params;

  try {
    const response = await fetchWithAuth(`/api/dashboard/master-leads/${inquiryId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body, visibility }),
    });

    if (response && (response.success || !response.error)) {
      return { id: response.id || `note-${Date.now()}` };
    }
    if (response?.error) {
      throw new Error(response.error);
    }
  } catch (apiErr: any) {
    console.log('[leadsRepository] addInternalNote API fallback to Supabase:', apiErr?.message);
    if (apiErr?.message?.includes('Unauthorized') || apiErr?.message?.includes('visibility')) {
      throw apiErr;
    }
  }

  const { data, error } = await supabase
    .from('master_lead_internal_notes')
    .insert({
      inquiry_id: inquiryId,
      author_user_id: authorUserId,
      body,
      visibility,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data?.id || `note-${Date.now()}` };
}

/**
 * Updates lead status in crm_inquiries.
 */
export async function updateLeadStatus(inquiryId: string, newStatus: string): Promise<void> {
  const isClosed = newStatus === 'closed_won';
  const isLost = newStatus === 'closed_lost';
  const dbStatus = isClosed ? 'closed' : isLost ? 'lost' : newStatus;

  const { error } = await supabase
    .from('crm_inquiries')
    .update({
      inquiry_status: dbStatus,
      master_lead_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId);

  if (error) throw error;
}

/**
 * Toggles agent sharing on a lead inquiry.
 */
export async function toggleAgentShare(inquiryId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('crm_inquiries')
    .update({
      agent_share_enabled: enabled,
      agent_share_enabled_at: enabled ? new Date().toISOString() : null,
    })
    .eq('id', inquiryId);

  if (error) throw error;
}
