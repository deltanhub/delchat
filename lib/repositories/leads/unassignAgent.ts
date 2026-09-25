import { supabase } from '../../supabase';

/**
 * Unassigns any currently assigned agent from a conversation and lead inquiry.
 */
export async function unassignAgentFromLead(params: {
  conversationId: string;
  currentUserId: string;
}): Promise<void> {
  const { conversationId, currentUserId } = params;

  await supabase
    .from('chat_conversations')
    .update({
      assigned_to_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  const { data: inqRow } = await supabase
    .from('crm_inquiries')
    .select('id, agency_user_id, assigned_agent_user_id')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (inqRow) {
    if (inqRow.assigned_agent_user_id) {
      await supabase
        .from('chat_participants')
        .update({
          can_send: false,
          removed_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', inqRow.assigned_agent_user_id)
        .is('removed_at', null);
    }

    await supabase
      .from('crm_inquiries')
      .update({
        assigned_agent_user_id: null,
        assigned_by_user_id: currentUserId || null,
        assigned_at: new Date().toISOString(),
        handoff_note: null,
        master_lead_status: 'new',
      })
      .eq('id', inqRow.id);

    await supabase.from('crm_inquiry_assignment_history').insert({
      inquiry_id: inqRow.id,
      conversation_id: conversationId,
      agency_user_id: inqRow.agency_user_id || currentUserId,
      assigned_agent_user_id: null,
      assigned_by_user_id: currentUserId,
      action_kind: 'unassigned',
      note: 'Unassigned via DelChat mobile governance',
    });
  }

  await supabase
    .from('crm_leads')
    .update({
      assigned_to_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId);

  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_type: 'system',
    sender_user_id: null,
    message_kind: 'system',
    body: 'Lead unassigned from active agent queue.',
    intent: 'assignment',
  });
}
