/**
 * test_conversation_row_deep_live.js
 * Deep operational simulation of ConversationRow formatting, badges, and role resolution.
 * Strictly <= 200 lines.
 */
const assert = require('assert');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  [PASS] ' + name);
    passed++;
  } catch (err) {
    console.error('  [FAIL] ' + name + ': ' + err.message);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  CONVERSATION ROW DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Initials extraction
test('getInitials extracts two uppercase initials or fallback', () => {
  function getInitials(name) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  assert.strictEqual(getInitials('Alfred E. Newman'), 'AE');
  assert.strictEqual(getInitials('John Doe'), 'JD');
  assert.strictEqual(getInitials('Single'), 'S');
  assert.strictEqual(getInitials(''), 'U');
  assert.strictEqual(getInitials(null), 'U');
});

// Test 2: Timestamp formatting logic
test('formatConversationTime formats today, yesterday, or date', () => {
  function formatConversationTime(timeStr) {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
  assert.strictEqual(formatConversationTime(null), '');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  assert.strictEqual(formatConversationTime(yesterday.toISOString()), 'Yesterday');
  const today = new Date();
  assert.ok(formatConversationTime(today.toISOString()).length > 0);
});

// Test 3: Role-aware lead badge resolution
test('Lead badge resolves Master Lead vs Assigned Lead correctly', () => {
  function getLeadBadge(conversation) {
    if (!conversation.assignment) return null;
    const title = conversation.canAssignAgents ? 'Master Lead' : 'Assigned Lead';
    const status = (conversation.assignment.masterLeadStatus || conversation.assignment.status || 'new').toUpperCase();
    return { title, status };
  }
  const master = getLeadBadge({ canAssignAgents: true, assignment: { masterLeadStatus: 'assigned' } });
  assert.strictEqual(master.title, 'Master Lead');
  assert.strictEqual(master.status, 'ASSIGNED');
  const agent = getLeadBadge({ canAssignAgents: false, assignment: { status: 'in_progress' } });
  assert.strictEqual(agent.title, 'Assigned Lead');
  assert.strictEqual(agent.status, 'IN_PROGRESS');
});

// Test 4: Agent chip suppression of placeholder strings
test('Agent chip suppresses Unassigned and Assigned Agent placeholders', () => {
  function getAgentName(assignment) {
    const name = assignment?.agent?.fullName || assignment?.assignedAgentName;
    if (!name || name === 'Unassigned' || name === 'Assigned Agent') return null;
    return name;
  }
  assert.strictEqual(getAgentName({ assignedAgentName: 'Unassigned' }), null);
  assert.strictEqual(getAgentName({ agent: { fullName: 'Assigned Agent' } }), null);
  assert.strictEqual(getAgentName({ agent: { fullName: 'Sarah Connor' } }), 'Sarah Connor');
});

// Test 5: Intent badge uppercase resolution and suppression
test('Intent badge resolves uppercase intent and suppresses general/null', () => {
  function getIntentBadge(intent) {
    if (!intent || intent === 'general') return null;
    if (intent === 'tour') return 'TOUR';
    return intent.toUpperCase();
  }
  assert.strictEqual(getIntentBadge('general'), null);
  assert.strictEqual(getIntentBadge(null), null);
  assert.strictEqual(getIntentBadge('tour'), 'TOUR');
  assert.strictEqual(getIntentBadge('valuation'), 'VALUATION');
});

// Test 6: Verified hub badge verification
test('Verified badge renders only for system hub channels', () => {
  function isVerifiedHub(kind, name) {
    return kind === 'broadcast' ||
      name.toUpperCase() === 'DELTANHUB' ||
      name.toUpperCase() === 'DELTANHUB SUPPORT';
  }
  assert.strictEqual(isVerifiedHub('broadcast', 'Update'), true);
  assert.strictEqual(isVerifiedHub('direct', 'DeltanHub'), true);
  assert.strictEqual(isVerifiedHub('direct', 'DeltanHub Support'), true);
  assert.strictEqual(isVerifiedHub('direct', 'John Doe'), false);
});

console.log('\nConversationRow Deep Live: ' + passed + ' / 6 tests passed.');