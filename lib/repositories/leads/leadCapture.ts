import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';
import { CaptureLeadParams } from './types';

/**
 * Creates a CRM lead from a chat conversation.
 * Hits DeltanHub server API /api/chats/lead with resilient direct Supabase fallback.
 * Inserts into crm_leads and injects in-chat lead card into chat_messages.
 */
export async function captureLead(
  params: CaptureLeadParams
): Promise<{ leadId: string; messageId?: string }> {
  const {
    conversationId,
    fullName,
    email,
    phone,
    note,
    currentUserId,
    partnerUserId,
    listingId,
    createdByName,
  } = params;

  try {
    const response = await fetchWithAuth('/api/chats/lead', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        fullName,
        email: email || '',
        phone: phone || '',
        note: note || '',
      }),
    });

    if (response && !response.error) {
      return {
        leadId: response.leadId || response.conversation?.assignment?.leadId || 'lead_created',
      };
    }
  } catch (apiErr: any) {
    console.log('[leadsRepository] /api/chats/lead fallback to direct Supabase:', apiErr?.message);
  }

  const { data: existingInquiry } = await supabase
    .from('crm_inquiries')
    .select('id, listing_id')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  let targetInquiryId = existingInquiry?.id;
  let effectiveListingId = existingInquiry?.listing_id || listingId;

  if (!targetInquiryId) {
    const { data: newInquiry } = await supabase
      .from('crm_inquiries')
      .insert({
        conversation_id: conversationId,
        buyer_user_id: partnerUserId || currentUserId,
        company_user_id: currentUserId,
        agency_user_id: currentUserId,
        listing_id: effectiveListingId || null,
        inquiry_status: 'new',
        master_lead_status: 'new',
        lead_name: fullName,
      })
      .select('id')
      .maybeSingle();

    targetInquiryId = newInquiry?.id;
  }

  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .insert({
      conversation_id: conversationId,
      inquiry_id: targetInquiryId || null,
      listing_id: effectiveListingId || null,
      source: 'chat',
      full_name: fullName,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      note: note?.trim() || null,
      assigned_to_user_id: currentUserId,
      created_by_user_id: currentUserId,
    })
    .select('id')
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message || 'Unable to create CRM lead record.');
  }

  const { data: messageRow } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_user_id: currentUserId,
      message_kind: 'lead',
      body: `Lead created for ${fullName}`,
      structured_payload: {
        card_kind: 'lead_capture',
        leadId: lead.id,
        fullName,
        email: email?.trim() || '',
        phone: phone?.trim() || '',
        note: note?.trim() || '',
        notes: note?.trim() || '',
        createdByName: createdByName || 'Agent',
      },
    })
    .select('id')
    .single();

  return {
    leadId: lead.id,
    messageId: messageRow?.id,
  };
}
