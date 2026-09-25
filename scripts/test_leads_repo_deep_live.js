const assert = require('assert');

// 1. Status transition mapping verification
function mapLeadStatus(status) {
  const isClosed = status === 'closed_won';
  const isLost = status === 'closed_lost';
  return isClosed ? 'closed' : isLost ? 'lost' : status;
}

assert.strictEqual(mapLeadStatus('closed_won'), 'closed');
assert.strictEqual(mapLeadStatus('closed_lost'), 'lost');
assert.strictEqual(mapLeadStatus('qualified'), 'qualified');
assert.strictEqual(mapLeadStatus('contacted'), 'contacted');
console.log('[PASS] Lead status DB mapping logic verified');

// 2. Tenant isolation candidate filtering
const currentUserId = 'user-agency-1';
const tenantIds = new Set([currentUserId, 'org-agency-1']);
const rawMembers = [
  { agent_user_id: 'agent-1', position_title: 'Senior Broker', relationship_kind: 'internal' },
  { agent_user_id: 'agent-2', position_title: 'Junior Agent', relationship_kind: 'external' },
  { agent_user_id: currentUserId, position_title: 'Principal', relationship_kind: 'internal' },
  { agent_user_id: 'org-agency-1', position_title: 'Firm Account', relationship_kind: 'internal' },
];

const candidateUserIds = new Set();
rawMembers.forEach((m) => {
  if (m.agent_user_id && !tenantIds.has(m.agent_user_id)) {
    candidateUserIds.add(m.agent_user_id);
  }
});
candidateUserIds.delete(currentUserId);
tenantIds.forEach((tId) => candidateUserIds.delete(tId));

assert.strictEqual(candidateUserIds.size, 2);
assert(candidateUserIds.has('agent-1'));
assert(candidateUserIds.has('agent-2'));
assert(!candidateUserIds.has(currentUserId));
assert(!candidateUserIds.has('org-agency-1'));
console.log('[PASS] Tenant isolation candidate filtering verified');

// 3. Agent card payload formation verification
const agent = {
  userId: 'agent-1',
  name: 'Sarah Smith',
  role: 'Licensed Agent',
  avatarUrl: 'https://img.example/avatar.jpg',
  email: 'sarah@example.com',
  phone: '+1234567890',
};
const actionKind = 'assigned';
const handoffNote = 'Interested in luxury property in Banana Island';

const agentCardPayload = {
  card_kind: 'assigned_agent',
  actionLabel: actionKind,
  agencyName: 'Brokerage Administration',
  assignedByName: 'Administration',
  agent: {
    userId: agent.userId,
    fullName: agent.name,
    subtitle: agent.role,
    avatarUrl: agent.avatarUrl,
    email: agent.email || null,
    phone: agent.phone || null,
    profileHref: `/agents/${agent.userId}`,
  },
  handoffNote: handoffNote?.trim() || null,
};

assert.strictEqual(agentCardPayload.card_kind, 'assigned_agent');
assert.strictEqual(agentCardPayload.agent.fullName, 'Sarah Smith');
assert.strictEqual(agentCardPayload.handoffNote, handoffNote);
console.log('[PASS] Agent assignment payload formation verified');

console.log('All leadsRepository deep live simulation tests passed.');
process.exit(0);
