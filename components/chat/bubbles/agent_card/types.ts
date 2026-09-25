import { ChatMessage } from '../types';

export interface AssignedAgentCardData {
  actionLabel: string;
  agencyName: string | null;
  assignedByName: string | null;
  agent: {
    userId: string;
    fullName: string;
    subtitle: string;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
    profileHref: string;
  };
}

export function parseAssignedAgentCard(message: ChatMessage): AssignedAgentCardData | null {
  const payload = message.structuredPayload;
  if (!payload && message.messageKind !== 'agent_card') {
    return null;
  }

  if (payload?.card_kind === 'assigned_agent') {
    const agent = payload.agent || {};
    return {
      actionLabel: payload.actionLabel || 'assigned',
      agencyName: payload.agencyName || null,
      assignedByName: payload.assignedByName || null,
      agent: {
        userId: agent.userId || '',
        fullName: agent.fullName || 'Assigned Agent',
        subtitle: agent.subtitle || 'Assigned agent',
        avatarUrl: agent.avatarUrl || null,
        email: agent.email || null,
        phone: agent.phone || null,
        profileHref: agent.profileHref || `/agents/${agent.userId}`,
      },
    };
  }

  if (payload?.agentCard || message.messageKind === 'agent_card') {
    const agent = payload?.agentCard || {};
    return {
      actionLabel: agent.actionLabel || 'assigned',
      agencyName: agent.agencyName || null,
      assignedByName: agent.assignedBy || null,
      agent: {
        userId: agent.agentUserId || agent.userId || '',
        fullName: agent.agentName || agent.fullName || 'Assigned Agent',
        subtitle: agent.agentRole || agent.subtitle || 'Assigned agent',
        avatarUrl: agent.agentAvatar || agent.avatarUrl || null,
        email: agent.agentEmail || agent.email || null,
        phone: agent.agentPhone || agent.phone || null,
        profileHref: `/agents/${agent.agentUserId || agent.userId}`,
      },
    };
  }

  return null;
}

export interface AgentCardBubbleProps {
  card: AssignedAgentCardData;
  message: ChatMessage;
  isStarred?: boolean;
  onReportAgent?: (card: AssignedAgentCardData) => void;
}
