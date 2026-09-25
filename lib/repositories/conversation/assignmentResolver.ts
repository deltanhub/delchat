import { canReceiveLeads, AppProfile } from '../../auth';

export interface ResolveAssignmentParams {
  inq: any;
  c: any;
  effectiveAgentUserId: string | null;
  assignedAgentName: string | null;
  assignedAgentAvatar: string | null;
  currentProfile: AppProfile | null;
}

export function resolveAssignmentObject({
  inq,
  c,
  effectiveAgentUserId,
  assignedAgentName,
  assignedAgentAvatar,
  currentProfile,
}: ResolveAssignmentParams) {
  const isViewerProfessional = canReceiveLeads(currentProfile?.mainRole);
  const hasAssignedAgent = Boolean(inq?.assigned_agent_user_id || effectiveAgentUserId);

  const assignmentObj = (inq && isViewerProfessional && hasAssignedAgent)
    ? {
        id: inq.id,
        inquiryId: inq.id,
        leadId: inq.id,
        status: inq.master_lead_status || inq.inquiry_status || 'new',
        masterLeadStatus: inq.master_lead_status || inq.inquiry_status || 'new',
        assignedAgentUserId: inq.assigned_agent_user_id || effectiveAgentUserId,
        assignedAgentName: (inq.assigned_agent_user_id || effectiveAgentUserId) ? (assignedAgentName || 'Assigned Agent') : null,
        assignedAgentAvatar: (inq.assigned_agent_user_id || effectiveAgentUserId) ? assignedAgentAvatar : null,
        assignedByUserId: inq.company_user_id || inq.agency_user_id || c.agency_user_id || null,
        assignedAt: inq.assigned_at || inq.created_at || c.updated_at || null,
        agencyUserId: inq.agency_user_id || inq.company_user_id || c.agency_user_id || null,
        agentShareEnabled: Boolean(inq.agent_share_enabled),
        handoffNote: inq.handoff_note || null,
        agent: inq.assigned_agent_user_id
          ? {
              userId: inq.assigned_agent_user_id,
              fullName: assignedAgentName || 'Assigned Agent',
              avatarUrl: assignedAgentAvatar,
            }
          : effectiveAgentUserId
          ? {
              userId: effectiveAgentUserId,
              fullName: assignedAgentName || 'Assigned Agent',
              avatarUrl: assignedAgentAvatar,
            }
          : null,
      }
    : (isViewerProfessional && effectiveAgentUserId)
    ? {
        id: `listing_inq_${c.id}`,
        inquiryId: `listing_inq_${c.id}`,
        leadId: `listing_inq_${c.id}`,
        status: 'new',
        masterLeadStatus: 'new',
        assignedAgentUserId: effectiveAgentUserId,
        assignedAgentName: effectiveAgentUserId ? (assignedAgentName || 'Assigned Agent') : null,
        assignedAgentAvatar: effectiveAgentUserId ? assignedAgentAvatar : null,
        assignedByUserId: c.agency_user_id || null,
        assignedAt: c.updated_at || null,
        agencyUserId: c.agency_user_id || null,
        agentShareEnabled: false,
        handoffNote: null,
        agent: effectiveAgentUserId
          ? {
              userId: effectiveAgentUserId,
              fullName: assignedAgentName || 'Assigned Agent',
              avatarUrl: assignedAgentAvatar,
            }
          : null,
      }
    : null;

  return assignmentObj;
}
