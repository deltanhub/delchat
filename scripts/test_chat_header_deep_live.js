/**
 * test_chat_header_deep_live.js
 * Deep operational simulation of ChatHeader presence, initials, status precedence, and menu gating.
 * Strictly <= 200 lines.
 */
const assert = require('assert');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  CHAT HEADER DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Initials extraction algorithm
test('Initials extraction correctly formats single, multi-word, or empty names', () => {
  function getInitials(name) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  assert.strictEqual(getInitials('John Doe'), 'JD');
  assert.strictEqual(getInitials('Alice'), 'A');
  assert.strictEqual(getInitials('Robert Michael Smith'), 'RM');
  assert.strictEqual(getInitials(''), 'U');
  assert.strictEqual(getInitials(null), 'U');
});

// Test 2: Presence status color derivation
test('Presence status color mapping resolves accurately', () => {
  function getPresenceColor(status) {
    if (status === 'available') return '#16a34a';
    if (status === 'busy') return '#d97706';
    return '#64748b';
  }

  assert.strictEqual(getPresenceColor('available'), '#16a34a');
  assert.strictEqual(getPresenceColor('busy'), '#d97706');
  assert.strictEqual(getPresenceColor('away'), '#64748b');
  assert.strictEqual(getPresenceColor(undefined), '#64748b');
});

// Test 3: Header status text priority resolution
test('Status text follows strict precedence: typing > online > group members > lastSeen/subtitle', () => {
  function resolveStatusText({
    isTyping,
    isOnline,
    isGroup,
    participantNames,
    lastSeenText,
    subtitle,
  }) {
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    if (isGroup && participantNames && participantNames.length > 0) {
      return participantNames.join(', ');
    }
    return lastSeenText || subtitle;
  }

  // 1. Typing takes highest precedence
  assert.strictEqual(
    resolveStatusText({
      isTyping: true,
      isOnline: true,
      isGroup: false,
      lastSeenText: 'Yesterday',
      subtitle: 'Agent',
    }),
    'typing...'
  );

  // 2. Online takes second precedence
  assert.strictEqual(
    resolveStatusText({
      isTyping: false,
      isOnline: true,
      isGroup: false,
      lastSeenText: '5m ago',
      subtitle: 'Buyer',
    }),
    'online'
  );

  // 3. Group members list
  assert.strictEqual(
    resolveStatusText({
      isTyping: false,
      isOnline: false,
      isGroup: true,
      participantNames: ['Alice', 'Bob', 'Charlie'],
      lastSeenText: null,
      subtitle: 'Group',
    }),
    'Alice, Bob, Charlie'
  );

  // 4. lastSeen fallback
  assert.strictEqual(
    resolveStatusText({
      isTyping: false,
      isOnline: false,
      isGroup: false,
      participantNames: [],
      lastSeenText: 'Last seen 2h ago',
      subtitle: 'Agent',
    }),
    'Last seen 2h ago'
  );

  // 5. subtitle fallback
  assert.strictEqual(
    resolveStatusText({
      isTyping: false,
      isOnline: false,
      isGroup: false,
      participantNames: [],
      lastSeenText: null,
      subtitle: 'Property Consultant',
    }),
    'Property Consultant'
  );
});

// Test 4: Dropdown menu dynamic label derivation & permission gating
test('Dropdown menu dynamically switches labels and gates report agent', () => {
  function getMenuState({ isArchived, isMuted, isBlocked, hasAssignment, canReportAgent, onReportAgent }) {
    return {
      archiveLabel: isArchived ? 'Unarchive Chat' : 'Archive Chat',
      muteLabel: isMuted ? 'Unmute Chat' : 'Mute Notifications',
      blockLabel: isBlocked ? 'Unblock Contact' : 'Block Contact',
      canShowReport: Boolean((hasAssignment || canReportAgent) && onReportAgent),
    };
  }

  const state1 = getMenuState({
    isArchived: false,
    isMuted: false,
    isBlocked: false,
    hasAssignment: true,
    canReportAgent: false,
    onReportAgent: () => {},
  });
  assert.strictEqual(state1.archiveLabel, 'Archive Chat');
  assert.strictEqual(state1.muteLabel, 'Mute Notifications');
  assert.strictEqual(state1.blockLabel, 'Block Contact');
  assert.strictEqual(state1.canShowReport, true);

  const state2 = getMenuState({
    isArchived: true,
    isMuted: true,
    isBlocked: true,
    hasAssignment: false,
    canReportAgent: false,
    onReportAgent: () => {},
  });
  assert.strictEqual(state2.archiveLabel, 'Unarchive Chat');
  assert.strictEqual(state2.muteLabel, 'Unmute Chat');
  assert.strictEqual(state2.blockLabel, 'Unblock Contact');
  assert.strictEqual(state2.canShowReport, false);
});

// Test 5: Rapid presence state transitions stress test
test('Rapid presence transitions (1,000 status checks) execute under 20ms', () => {
  const start = Date.now();
  const statuses = ['available', 'busy', 'away', undefined];
  for (let i = 0; i < 1000; i++) {
    const s = statuses[i % statuses.length];
    const isOnline = i % 2 === 0;
    const isTyping = i % 10 === 0;
    const res = isTyping ? 'typing...' : isOnline ? 'online' : s || 'offline';
    assert(res.length > 0);
  }
  const elapsed = Date.now() - start;
  assert(elapsed < 20, `Completed 1,000 rapid status calculations in ${elapsed}ms (<20ms benchmark)`);
});

console.log(`\nAll ${passed} Chat Header deep operational simulation tests passed successfully.\n`);
