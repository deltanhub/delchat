const assert = require('assert');

// Simulate parseAssignedAgentCard logic
function parseAssignedAgentCard(message) {
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

// 1. Test modern assigned_agent payload
const modernMsg = {
  messageKind: 'agent_card',
  structuredPayload: {
    card_kind: 'assigned_agent',
    actionLabel: 'reassigned',
    agencyName: 'Apex Realty',
    assignedByName: 'Principal Broker',
    agent: {
      userId: 'user_456',
      fullName: 'Sarah Jenkins',
      subtitle: 'Senior Property Consultant',
      avatarUrl: 'https://example.com/avatar.jpg',
      email: 'sarah@example.com',
      phone: '+2348000000000',
    },
  },
};
const res1 = parseAssignedAgentCard(modernMsg);
assert(res1 !== null, 'res1 should not be null');
assert.strictEqual(res1.actionLabel, 'reassigned');
assert.strictEqual(res1.agencyName, 'Apex Realty');
assert.strictEqual(res1.agent.fullName, 'Sarah Jenkins');
assert.strictEqual(res1.agent.profileHref, '/agents/user_456');
console.log('[PASS] Modern assigned_agent parsing verified');

// 2. Test legacy agentCard payload
const legacyMsg = {
  messageKind: 'agent_card',
  structuredPayload: {
    agentCard: {
      agentUserId: 'user_789',
      agentName: 'John Doe',
      agentRole: 'Associate Partner',
      assignedBy: 'Director',
      agentEmail: 'john@example.com',
    },
  },
};
const res2 = parseAssignedAgentCard(legacyMsg);
assert(res2 !== null, 'res2 should not be null');
assert.strictEqual(res2.actionLabel, 'assigned');
assert.strictEqual(res2.agent.userId, 'user_789');
assert.strictEqual(res2.agent.fullName, 'John Doe');
assert.strictEqual(res2.assignedByName, 'Director');
console.log('[PASS] Legacy agentCard parsing verified');

// 3. Test null / non-card message
const textMsg = { messageKind: 'text', body: 'Hello world' };
assert.strictEqual(parseAssignedAgentCard(textMsg), null);
console.log('[PASS] Non-card message returns null verified');

console.log('All AgentCard deep live simulation tests passed.');
process.exit(0);
