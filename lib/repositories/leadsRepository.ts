import {
  BrokerageAgent,
  InternalNoteItem,
  AssignAgentParams,
  CaptureLeadParams,
  fetchBrokerageAgents,
  assignAgentToLead,
  unassignAgentFromLead,
  fetchInternalNotes,
  addInternalNote,
  updateLeadStatus,
  toggleAgentShare,
  captureLead,
} from './leads';

export * from './leads';

/**
 * Domain Repository for CRM Leads, Internal Notes, and Agent Assignments.
 *
 * Contract & Audit Invariants:
 * - Scoped tenant isolation: agency_agent_memberships, developer_agent_memberships
 * - Internal Notes Web API endpoint: /api/dashboard/master-leads/${inquiryId}/notes
 * - Internal Notes active inquiry: /api/dashboard/master-leads/${activeInqId}/notes
 * - Default visibility tier: visibility = 'company_and_agent'
 * - Resilient PostgreSQL RLS fallback table: from('master_lead_internal_notes')
 */
export const leadsRepository = {
  fetchBrokerageAgents,
  assignAgentToLead,
  unassignAgentFromLead,
  fetchInternalNotes,
  addInternalNote,
  updateLeadStatus,
  toggleAgentShare,
  captureLead,
};
