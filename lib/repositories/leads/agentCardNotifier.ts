import { supabase } from '../../supabase';
import { dispatchPushNotification } from '../../push-notifications';
import { BrokerageAgent } from './types';

export async function notifyAgentAssigned(params: {
  conversationId: string;
  currentUserId: string;
  selectedAgent: BrokerageAgent;
  handoffNote?: string;
  actionKind: 'assigned' | 'reassigned';
}): Promise<void> {
  const { conversationId, currentUserId, selectedAgent, handoffNote, actionKind } = params;

  const agentCardPayload = {
    card_kind: 'assigned_agent',
    actionLabel: actionKind,
    agencyName: 'Brokerage Administration',
    assignedByName: 'Administration',
    agent: {
      userId: selectedAgent.userId,
      fullName: selectedAgent.name,
      subtitle: selectedAgent.role,
      avatarUrl: selectedAgent.avatarUrl,
      email: selectedAgent.email || null,
      phone: selectedAgent.phone || null,
      profileHref: `/agents/${selectedAgent.userId}`,
    },
    handoffNote: handoffNote?.trim() || null,
  };

  const actionText = actionKind === 'reassigned'
    ? `Lead assigned to agent ${selectedAgent.name}.`
    : `Agent ${selectedAgent.name} introduced to conversation.`;

  const { data: insertedMsg } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_user_id: currentUserId,
      sender_type: 'admin',
      message_kind: 'agent_card',
      body: actionText,
      structured_payload: agentCardPayload,
    })
    .select('id')
    .maybeSingle();

  dispatchPushNotification({
    conversationId,
    messageId: insertedMsg?.id || 'agent_card_' + Date.now(),
    body: 'You have been assigned to a client conversation.',
    senderName: 'Lead Management',
    messageKind: 'agent_card',
  }).catch(() => {});
}
