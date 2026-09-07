import { supabase } from '../supabase';
import { resolveAvatarUrl } from '../media-utils';
import { dispatchPushNotification } from '../push-notifications';

export interface BrokerageAgent {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl: string | null;
  role: string;
}

export interface InternalNoteItem {
  id: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface AssignAgentParams {
  conversationId: string;
  currentUserId: string;
  currentAssignedAgentId?: string | null;
  selectedAgent: BrokerageAgent;
  handoffNote?: string;
}

/**
 * Domain Repository for CRM Leads, Internal Notes, and Agent Assignments.
 */
export const leadsRepository = {
  /**
   * Fetches eligible brokerage agents scoped to the active organization memberships.
   * Strictly verifies tenant isolation across agency_agent_memberships and developer_agent_memberships.
   */
  async fetchBrokerageAgents(
    currentUserId: string,
    conversationId?: string
  ): Promise<BrokerageAgent[]> {
    const tenantIds = new Set<string>();
    tenantIds.add(currentUserId);

    // Check if current conversation is linked to a crm inquiry with an organization
    if (conversationId) {
      const { data: inq } = await supabase
        .from('crm_inquiries')
        .select('agency_user_id, developer_user_id')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (inq?.agency_user_id) tenantIds.add(inq.agency_user_id);
      if (inq?.developer_user_id) tenantIds.add(inq.developer_user_id);
    }

    // Check if current user is an agent belonging to an agency
    const { data: myMemberships } = await supabase
      .from('agency_agent_memberships')
      .select('agency_user_id')
      .eq('agent_user_id', currentUserId)
      .eq('membership_status', 'active');

    myMemberships?.forEach((m: any) => {
      if (m.agency_user_id) tenantIds.add(m.agency_user_id);
    });

    const tenantIdArray = Array.from(tenantIds);

    // Fetch active agents in the organization(s)
    const { data: agencyMembers } = await supabase
      .from('agency_agent_memberships')
      .select('agent_user_id, position_title')
      .in('agency_user_id', tenantIdArray)
      .eq('membership_status', 'active');

    const { data: devMembers } = await supabase
      .from('developer_agent_memberships')
      .select('agent_user_id')
      .in('developer_user_id', tenantIdArray)
      .eq('membership_status', 'active');

    const candidateUserIds = new Set<string>(tenantIdArray);
    agencyMembers?.forEach((m: any) => {
      if (m.agent_user_id) candidateUserIds.add(m.agent_user_id);
    });
    devMembers?.forEach((m: any) => {
      if (m.agent_user_id) candidateUserIds.add(m.agent_user_id);
    });

    const candidateArray = Array.from(candidateUserIds);
    if (candidateArray.length === 0) {
      return [];
    }

    // Resolve public profiles safely via RPC get_public_user_profiles
    const { data: profiles, error: rpcError } = await supabase.rpc('get_public_user_profiles', {
      requested_user_ids: candidateArray,
    });

    if (rpcError) throw rpcError;

    if (!profiles) return [];

    return profiles.map((p: any) => ({
      userId: p.user_id,
      name: p.display_name?.trim() || p.full_name?.trim() || 'Agent',
      email: undefined,
      phone: undefined,
      avatarUrl: resolveAvatarUrl(p.avatar_url),
      role:
        p.main_role === 'agency'
          ? 'Principal Broker'
          : p.main_role === 'developer'
          ? 'Lead Developer'
          : p.main_role === 'manager'
          ? 'Sales Manager'
          : 'Licensed Agent',
    }));
  },

  /**
   * Assigns or reassigns an agent to a lead conversation and sends audit notifications.
   */
  async assignAgentToLead(params: AssignAgentParams): Promise<void> {
    const { conversationId, currentUserId, currentAssignedAgentId, selectedAgent, handoffNote } =
      params;
    const isReassignment = Boolean(currentAssignedAgentId);
    const actionKind = isReassignment ? 'reassigned' : 'assigned';

    // 1. Update conversation assigned_to_user_id
    await supabase
      .from('chat_conversations')
      .update({
        assigned_to_user_id: selectedAgent.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // 2. Check and update crm_inquiries if exists
    const { data: inqRow } = await supabase
      .from('crm_inquiries')
      .select('id, agency_user_id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (inqRow) {
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
    }

    // 3. Post audit card message into chat
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

    const actionText = isReassignment
      ? `Lead assigned to agent ${selectedAgent.name}.`
      : `Agent ${selectedAgent.name} introduced to conversation.`;

    const { data: insertedMsg } = await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_user_id: currentUserId,
      sender_type: 'admin',
      message_kind: 'agent_card',
      body: actionText,
      structured_payload: agentCardPayload,
    }).select('id').maybeSingle();

    // 4. Dispatch push notification to assigned agent
    dispatchPushNotification({
      conversationId: conversationId,
      messageId: insertedMsg?.id || 'agent_card_' + Date.now(),
      body: `You have been assigned to a client conversation.`,
      senderName: 'Lead Management',
      messageKind: 'agent_card',
    }).catch(() => {});
  },

  /**
   * Unassigns any currently assigned agent from a conversation and lead inquiry.
   */
  async unassignAgentFromLead(params: {
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
      .select('id, agency_user_id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (inqRow) {
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

    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      sender_user_id: null,
      message_kind: 'system',
      body: 'Lead unassigned from active agent queue.',
      intent: 'assignment',
    });
  },

  /**
   * Fetches internal broker notes for a lead inquiry.
   */
  async fetchInternalNotes(params: {
    inquiryId?: string | null;
    conversationId?: string | null;
  }): Promise<{ inquiryId: string | null; notes: InternalNoteItem[] }> {
    const { inquiryId, conversationId } = params;
    let activeInqId = inquiryId || null;

    if (!activeInqId && conversationId) {
      const { data: inqRow } = await supabase
        .from('crm_inquiries')
        .select('id')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (inqRow) {
        activeInqId = inqRow.id;
      }
    }

    if (activeInqId) {
      const { data: noteRows, error: noteErr } = await supabase
        .from('master_lead_internal_notes')
        .select('id, author_user_id, body, created_at')
        .eq('inquiry_id', activeInqId)
        .order('created_at', { ascending: false });

      if (!noteErr && noteRows && noteRows.length > 0) {
        const authorIds = Array.from(new Set(noteRows.map((n: any) => n.author_user_id)));
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, full_name')
          .in('user_id', authorIds);

        const nameMap = new Map(
          (profiles || []).map((p: any) => [p.user_id, p.display_name || p.full_name || 'Agent'])
        );

        return {
          inquiryId: activeInqId,
          notes: noteRows.map((n: any) => ({
            id: n.id,
            authorUserId: n.author_user_id,
            authorName: nameMap.get(n.author_user_id) || 'Team Member',
            body: n.body,
            createdAt: n.created_at,
          })),
        };
      }
    }

    // Fallback: Query chat_messages where intent = 'internal_note'
    if (conversationId) {
      const { data: msgRows, error: msgErr } = await supabase
        .from('chat_messages')
        .select('id, sender_user_id, body, created_at')
        .eq('conversation_id', conversationId)
        .eq('intent', 'internal_note')
        .order('created_at', { ascending: false });

      if (!msgErr && msgRows) {
        const authorIds = Array.from(
          new Set(msgRows.map((m: any) => m.sender_user_id).filter(Boolean))
        );
        let nameMap = new Map<string, string>();
        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, full_name')
            .in('user_id', authorIds);
          (profiles || []).forEach((p: any) => {
            nameMap.set(p.user_id, p.display_name || p.full_name || 'Agent');
          });
        }

        return {
          inquiryId: activeInqId,
          notes: msgRows.map((m: any) => ({
            id: m.id,
            authorUserId: m.sender_user_id,
            authorName: nameMap.get(m.sender_user_id) || 'Team Member',
            body: m.body,
            createdAt: m.created_at,
          })),
        };
      }
    }

    return { inquiryId: activeInqId, notes: [] };
  },

  /**
   * Adds an internal note to a lead.
   */
  async addInternalNote(params: {
    inquiryId: string;
    authorUserId: string;
    body: string;
  }): Promise<void> {
    const { inquiryId, authorUserId, body } = params;
    const { error } = await supabase.from('master_lead_internal_notes').insert({
      inquiry_id: inquiryId,
      author_user_id: authorUserId,
      body,
      visibility: 'company_and_agent',
    });
    if (error) throw error;
  },

  /**
   * Updates lead status in crm_inquiries.
   */
  async updateLeadStatus(inquiryId: string, newStatus: string): Promise<void> {
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
  },

  /**
   * Toggles agent sharing on a lead inquiry.
   */
  async toggleAgentShare(inquiryId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('crm_inquiries')
      .update({
        agent_share_enabled: enabled,
        agent_share_enabled_at: enabled ? new Date().toISOString() : null,
      })
      .eq('id', inquiryId);

    if (error) throw error;
  },
};
