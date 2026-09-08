import { supabase } from '../supabase';
import { resolveAvatarUrl } from '../media-utils';
import { dispatchPushNotification } from '../push-notifications';
import { fetchWithAuth } from '../api-client';

export interface BrokerageAgent {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl: string | null;
  role: string;
  agentType?: 'internal' | 'external';
  positionTitle?: string | null;
}

export interface InternalNoteItem {
  id: string;
  inquiryId?: string;
  inquiry_id?: string;
  authorUserId?: string;
  author_user_id?: string;
  authorName: string;
  author_name?: string;
  body: string;
  visibility?: 'company_only' | 'company_and_agent';
  createdAt: string;
  created_at?: string;
}

export interface AssignAgentParams {
  conversationId: string;
  currentUserId: string;
  currentAssignedAgentId?: string | null;
  selectedAgent: BrokerageAgent;
  handoffNote?: string;
}

export interface CaptureLeadParams {
  conversationId: string;
  fullName: string;
  email?: string;
  phone?: string;
  note?: string;
  currentUserId: string;
  partnerUserId?: string | null;
  listingId?: string | null;
  createdByName?: string | null;
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
      .select('agent_user_id, position_title, relationship_kind')
      .in('agency_user_id', tenantIdArray)
      .eq('membership_status', 'active');

    const { data: devMembers } = await supabase
      .from('developer_agent_memberships')
      .select('agent_user_id, position_title, relationship_kind')
      .in('developer_user_id', tenantIdArray)
      .eq('membership_status', 'active');

    const candidateUserIds = new Set<string>();
    const agentMetaMap = new Map<
      string,
      {
        agentType: 'internal' | 'external';
        positionTitle?: string | null;
      }
    >();

    agencyMembers?.forEach((m: any) => {
      if (m.agent_user_id && !tenantIds.has(m.agent_user_id)) {
        candidateUserIds.add(m.agent_user_id);
        agentMetaMap.set(m.agent_user_id, {
          agentType: m.relationship_kind === 'external' ? 'external' : 'internal',
          positionTitle: m.position_title || null,
        });
      }
    });

    devMembers?.forEach((m: any) => {
      if (m.agent_user_id && !tenantIds.has(m.agent_user_id)) {
        candidateUserIds.add(m.agent_user_id);
        if (!agentMetaMap.has(m.agent_user_id)) {
          agentMetaMap.set(m.agent_user_id, {
            agentType: m.relationship_kind === 'external' ? 'external' : 'internal',
            positionTitle: m.position_title || null,
          });
        }
      }
    });

    // Explicitly guarantee the logged-in agency/org account itself is excluded from assignable subordinate agents
    candidateUserIds.delete(currentUserId);
    tenantIds.forEach((tId) => candidateUserIds.delete(tId));

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

    return profiles.map((p: any) => {
      const meta = agentMetaMap.get(p.user_id);
      const isExternal =
        meta?.agentType === 'external' || p.agent_account_kind === 'external';

      return {
        userId: p.user_id,
        name: p.display_name?.trim() || p.full_name?.trim() || 'Agent',
        email: undefined,
        phone: undefined,
        avatarUrl: resolveAvatarUrl(p.avatar_url),
        role:
          meta?.positionTitle ||
          (p.main_role === 'agency'
            ? 'Principal Broker'
            : p.main_role === 'developer'
            ? 'Lead Developer'
            : p.main_role === 'manager'
            ? 'Sales Manager'
            : 'Licensed Agent'),
        agentType: (isExternal ? 'external' : 'internal') as 'internal' | 'external',
        positionTitle: meta?.positionTitle || null,
      };
    });
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

      // If previous agent was different, deactivate previous agent in chat_participants
      if (inqRow.assigned_agent_user_id && inqRow.assigned_agent_user_id !== selectedAgent.userId) {
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
          assigned_agent_user_id: selectedAgent.userId,
          assigned_by_user_id: currentUserId,
          assigned_at: new Date().toISOString(),
          handoff_note: handoffNote?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inqRow.id);
    } else {
      // Promote unassociated or listing conversation to a crm_inquiries row
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

      if (newInq?.id) {
        targetInquiryId = newInq.id;
      }
    }

    // 3. Upsert assigned agent into chat_participants so agent has immediate message & read access
    const { data: existingPart } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', selectedAgent.userId)
      .maybeSingle();

    if (existingPart?.id) {
      await supabase
        .from('chat_participants')
        .update({
          participant_role: 'agent',
          can_send: true,
          removed_at: null,
        })
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

    // 5. Update crm_leads if exists for this conversation
    await supabase
      .from('crm_leads')
      .update({
        assigned_to_user_id: selectedAgent.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId);

    // 6. Post audit card message into chat
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

    // 7. Dispatch push notification to assigned agent
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
      .select('id, agency_user_id, assigned_agent_user_id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (inqRow) {
      if (inqRow.assigned_agent_user_id) {
        // Deactivate agent in chat_participants
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
  },

  /**
   * Fetches internal broker notes for a lead inquiry.
   * Hits DeltanHub Web API /api/dashboard/master-leads/${inquiryId}/notes with resilient Supabase fallback.
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
      // 1. Primary: Query DeltanHub Web API route for server parity, access control & visibility tier enforcement
      try {
        const res = await fetchWithAuth(`/api/dashboard/master-leads/${activeInqId}/notes`);
        if (res && Array.isArray(res.notes)) {
          const mapped: InternalNoteItem[] = res.notes.map((n: any) => ({
            id: n.id,
            inquiryId: activeInqId,
            inquiry_id: activeInqId,
            authorUserId: n.authorUserId,
            author_user_id: n.authorUserId,
            authorName: n.authorName || 'Team Member',
            author_name: n.authorName || 'Team Member',
            body: n.body,
            visibility: n.visibility || 'company_and_agent',
            createdAt: n.createdAt,
            created_at: n.createdAt,
          }));
          return { inquiryId: activeInqId, notes: mapped };
        }
      } catch (apiErr: any) {
        console.log('[leadsRepository] fetchInternalNotes API fallback to Supabase:', apiErr?.message);
      }

      // 2. Resilient Fallback: Direct Supabase query backed by PostgreSQL RLS
      const { data: noteRows, error: noteErr } = await supabase
        .from('master_lead_internal_notes')
        .select('id, inquiry_id, author_user_id, body, visibility, created_at')
        .eq('inquiry_id', activeInqId)
        .order('created_at', { ascending: false });

      if (!noteErr && noteRows && noteRows.length > 0) {
        const authorIds = Array.from(new Set(noteRows.map((n: any) => n.author_user_id).filter(Boolean)));
        let profileMap = new Map<string, string>();
        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, full_name')
            .in('user_id', authorIds);
          (profiles || []).forEach((p: any) => {
            profileMap.set(p.user_id, p.display_name || p.full_name || 'Agent');
          });
        }

        return {
          inquiryId: activeInqId,
          notes: noteRows.map((n: any) => {
            const authorName = profileMap.get(n.author_user_id) || 'Team Member';
            return {
              id: n.id,
              inquiryId: activeInqId,
              inquiry_id: activeInqId,
              authorUserId: n.author_user_id,
              author_user_id: n.author_user_id,
              authorName,
              author_name: authorName,
              body: n.body,
              visibility: n.visibility || 'company_and_agent',
              createdAt: n.created_at,
              created_at: n.created_at,
            };
          }),
        };
      }
    }

    // 3. Fallback: Query chat_messages where intent = 'internal_note'
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
            author_user_id: m.sender_user_id,
            authorName: nameMap.get(m.sender_user_id) || 'Team Member',
            author_name: nameMap.get(m.sender_user_id) || 'Team Member',
            body: m.body,
            visibility: 'company_and_agent' as const,
            createdAt: m.created_at,
            created_at: m.created_at,
          })),
        };
      }
    }

    return { inquiryId: activeInqId, notes: [] };
  },

  /**
   * Adds an internal note to a lead.
   * Dispatches to DeltanHub Web API /api/dashboard/master-leads/${inquiryId}/notes
   * with resilient direct Supabase fallback protected by PostgreSQL RLS.
   */
  async addInternalNote(params: {
    inquiryId: string;
    authorUserId: string;
    body: string;
    visibility?: 'company_only' | 'company_and_agent';
  }): Promise<{ id: string }> {
    const { inquiryId, authorUserId, body, visibility = 'company_and_agent' } = params;

    // 1. Primary: Call DeltanHub Web API /api/dashboard/master-leads/${inquiryId}/notes
    // for server-side validation, permission checks and dashboard activity logging (lead_note_added)
    try {
      const response = await fetchWithAuth(`/api/dashboard/master-leads/${inquiryId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          body,
          visibility,
        }),
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

    // 2. Resilient Fallback: Direct Supabase insert protected by PostgreSQL RLS
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

  /**
   * Creates a CRM lead from a chat conversation.
   * Hits DeltanHub server API /api/chats/lead with resilient direct Supabase fallback.
   * Inserts into crm_leads and injects in-chat lead card into chat_messages.
   */
  async captureLead(params: CaptureLeadParams): Promise<{ leadId: string; messageId?: string }> {
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

    // 1. First attempt DeltanHub Web API for server-side guardrails & audit logs
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

    // 2. Direct Supabase transaction fallback
    // Check or create crm_inquiries row for this conversation
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

    // Insert into crm_leads
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

    // Dispatch in-chat Lead Card into chat_messages
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
  },
};
