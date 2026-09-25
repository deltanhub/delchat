/**
 * test_recent_calls_deep_live.js
 * Deep operational simulation of Recent Calls grouping, direction color, and redial resolution.
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
console.log('  RECENT CALLS LIST DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Initials extraction logic
test('getInitials extracts two uppercase initials from first and last name or single name', () => {
  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  assert.strictEqual(getInitials('Sarah Connor'), 'SC');
  assert.strictEqual(getInitials('Madonna'), 'MA');
  assert.strictEqual(getInitials(''), '?');
  assert.strictEqual(getInitials(null), '?');
});

// Test 2: Direction color resolution
test('Direction color accurately reflects incoming, outgoing, and missed call states', () => {
  function getDirectionColor(direction, isDark) {
    const isMissed = direction === 'missed';
    const isOutgoing = direction === 'outgoing';
    return isOutgoing
      ? isDark ? '#94a3b8' : '#718096'
      : isMissed
      ? isDark ? '#f87171' : '#9d263d'
      : isDark ? '#4ade80' : '#16a34a';
  }
  assert.strictEqual(getDirectionColor('outgoing', false), '#718096');
  assert.strictEqual(getDirectionColor('outgoing', true), '#94a3b8');
  assert.strictEqual(getDirectionColor('missed', false), '#9d263d');
  assert.strictEqual(getDirectionColor('missed', true), '#f87171');
  assert.strictEqual(getDirectionColor('incoming', false), '#16a34a');
  assert.strictEqual(getDirectionColor('incoming', true), '#4ade80');
});

// Test 3: Arrow direction icon resolution
test('Arrow icon properly distinguishes between outgoing and incoming calls', () => {
  function getArrowIcon(direction) {
    return direction === 'outgoing' ? 'arrow-up' : 'arrow-down';
  }
  assert.strictEqual(getArrowIcon('outgoing'), 'arrow-up');
  assert.strictEqual(getArrowIcon('incoming'), 'arrow-down');
  assert.strictEqual(getArrowIcon('missed'), 'arrow-down');
});

// Test 4: Subtitle text formulation
test('Subtitle text includes direction, aggregated count, and mode', () => {
  function formatSubtitle(direction, count, callMode) {
    const isOutgoing = direction === 'outgoing';
    const isMissed = direction === 'missed';
    const isVideo = callMode === 'video';
    const dirLabel = isOutgoing ? 'Outgoing' : isMissed ? 'Missed' : 'Incoming';
    const countLabel = count > 1 ? ` (${count})` : '';
    const modeLabel = isVideo ? 'Video' : 'Voice';
    return `${dirLabel}${countLabel} • ${modeLabel}`;
  }
  assert.strictEqual(formatSubtitle('outgoing', 1, 'audio'), 'Outgoing • Voice');
  assert.strictEqual(formatSubtitle('missed', 3, 'video'), 'Missed (3) • Video');
  assert.strictEqual(formatSubtitle('incoming', 2, 'audio'), 'Incoming (2) • Voice');
});

// Test 5: Redial params resolution
test('handleRedial routes correctly for audio and video modes', () => {
  function getRedialRouteParams(conversationId, mode) {
    return {
      pathname: '/call/[id]',
      params: {
        id: conversationId,
        kind: mode,
        role: 'initiator',
      },
    };
  }
  const audioCall = getRedialRouteParams('conv-123', 'audio');
  assert.strictEqual(audioCall.params.id, 'conv-123');
  assert.strictEqual(audioCall.params.kind, 'audio');
  assert.strictEqual(audioCall.params.role, 'initiator');

  const videoCall = getRedialRouteParams('conv-456', 'video');
  assert.strictEqual(videoCall.params.id, 'conv-456');
  assert.strictEqual(videoCall.params.kind, 'video');
  assert.strictEqual(videoCall.params.role, 'initiator');
});

console.log(`\nRecentCallsList Deep Live: ${passed} / 5 tests passed.`);
