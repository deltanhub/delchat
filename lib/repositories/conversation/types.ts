/** WhatsApp/Telegram-style mute durations */
export type MuteDuration = '8h' | '1w' | 'always' | 'unmute';

export interface FetchInboxOptions {
  maxMsgLimit?: number;
}

export interface AssignmentMappingData {
  id: string;
  inquiryId: string;
  leadId: string;
  status: string;
  masterLeadStatus: string;
  assignedAgentUserId: string | null;
  assignedAgentName: string | null;
  assignedAgentAvatar: string | null;
  assignedByUserId: string | null;
  assignedAt: string | null;
  agencyUserId: string | null;
  agentShareEnabled: boolean;
  handoffNote: string | null;
  agent: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}
