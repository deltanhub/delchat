import { supabase } from '../../supabase';
import { AssignAgentParams } from './types';
import { notifyAgentAssigned } from './agentCardNotifier';

export async function assignAgentToLead(params: AssignAgentParams): Promise<void> {
  const { conversationId, currentUserId, currentAssignedAgentId, selectedAgent, handoffNote } = params;
  const isReassignment = Boolean(currentAssignedAgentId);
  const actionKind = isReassignment ? 'reassigned' : 'assigned';

  // 1. Update conversation assigned_to_user_id
  await supabase
    .from('chat_conversations')
    .update({ assigned_to_user_id: selectedAgent.userId, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // 2. Check and update or create crm_inquiries
  let targetInquiryId: string | null = null;
  let targetAgencyUserId = currentUserId;

  const { data: inqRow } = await supabase
    .from('crm_inquiries')
    .select('id, agency_user_id, company_user_id, assigned_agent_user_id')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (inqRow) {
    targetInquiryId = inqRow.id;
    targetAgencyUserId = inqRow.agency_user_id || inqRow.company_user_id || currentUserId;

    if (inqRow.assigned_agent_user_id && inqRow.assigned_agent_user_id !== selectedAgent.userId) {
      await supabase
        .from('chat_participants')
        .update({ can_send: false, removed_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', inqRow.assigned_agent_user_id)
        .is('removed_at', null);
    }

    await supabase
      .from('crm_inquiries')
      .update({
        assigned_agent_user_id: selectedAgent.userId,
        assigned_by_user_id: currentUserId,
        assigned_at: new Date().toISOString(),
        handoff_note: handoffNote?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inqRow.id);
  } else {
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('listing_id, context_snapshot')
      .eq('id', conversationId)
      .maybeSingle();

    const { data: parts } = await supabase
      .from('chat_participants')
      .select('user_id, participant_role')
      .eq('conversation_id', conversationId)
      .is('removed_at', null);

    const buyerPart = (parts || []).find((p: any) => p.user_id !== currentUserId);

    const { data: newInq } = await supabase
      .from('crm_inquiries')
      .insert({
        conversation_id: conversationId,
        buyer_user_id: buyerPart?.user_id || null,
        company_user_id: currentUserId,
        agency_user_id: currentUserId,
        listing_id: conv?.listing_id || null,
        assigned_agent_user_id: selectedAgent.userId,
        assigned_by_user_id: currentUserId,
        assigned_at: new Date().toISOString(),
        handoff_note: handoffNote?.trim() || null,
        inquiry_status: 'new',
        master_lead_status: 'new',
      })
      .select('id')
      .maybeSingle();

    if (newInq?.id) targetInquiryId = newInq.id;
  }

  // 3. Upsert assigned agent into chat_participants
  const { data: existingPart } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', selectedAgent.userId)
    .maybeSingle();

  if (existingPart?.id) {
    await supabase
      .from('chat_participants')
      .update({ participant_role: 'agent', can_send: true, removed_at: null })
      .eq('id', existingPart.id);
  } else {
    await supabase.from('chat_participants').insert({
      conversation_id: conversationId,
      user_id: selectedAgent.userId,
      participant_role: 'agent',
      can_send: true,
      removed_at: null,
    });
  }

  // 4. Record assignment history audit entry
  if (targetInquiryId) {
    await supabase.from('crm_inquiry_assignment_history').insert({
      inquiry_id: targetInquiryId,
      conversation_id: conversationId,
      agency_user_id: targetAgencyUserId,
      assigned_agent_user_id: selectedAgent.userId,
      assigned_by_user_id: currentUserId,
      action_kind: actionKind,
      note: handoffNote?.trim() || null,
    });
  }

  // 5. Update crm_leads if exists
  await supabase
    .from('crm_leads')
    .update({ assigned_to_user_id: selectedAgent.userId, updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId);

  // 6. Post audit card message and dispatch push notification
  await notifyAgentAssigned({
    conversationId,
    currentUserId,
    selectedAgent,
    handoffNote,
    actionKind,
  });
}
