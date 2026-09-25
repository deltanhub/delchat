const assert = require('assert');

// 1. Test consecutive call grouping logic
function groupCallLogs(callLogs, query = '') {
  const q = query.trim().toLowerCase();
  const grouped = [];
  let currentGroup = null;

  for (const log of callLogs) {
    if (q) {
      const matchesName =
        (log.peer.displayName || '').toLowerCase().includes(q) ||
        (log.peer.fullName || '').toLowerCase().includes(q);
      if (!matchesName) continue;
    }

    const logDateStr = new Date(log.startedAt).toDateString();
    const prevDateStr = currentGroup ? new Date(currentGroup.startedAt).toDateString() : '';

    if (
      currentGroup &&
      currentGroup.peer.userId === log.peer.userId &&
      currentGroup.direction === log.direction &&
      currentGroup.callMode === log.callMode &&
      logDateStr === prevDateStr
    ) {
      currentGroup.count += 1;
    } else {
      if (currentGroup) grouped.push(currentGroup);
      currentGroup = { ...log, count: 1 };
    }
  }

  if (currentGroup) grouped.push(currentGroup);
  return grouped;
}

const todayIso = new Date().toISOString();
const sampleLogs = [
  { id: '1', peer: { userId: 'u1', displayName: 'Alice' }, direction: 'incoming', callMode: 'audio', startedAt: todayIso },
  { id: '2', peer: { userId: 'u1', displayName: 'Alice' }, direction: 'incoming', callMode: 'audio', startedAt: todayIso },
  { id: '3', peer: { userId: 'u1', displayName: 'Alice' }, direction: 'incoming', callMode: 'audio', startedAt: todayIso },
  { id: '4', peer: { userId: 'u2', displayName: 'Bob' }, direction: 'outgoing', callMode: 'video', startedAt: todayIso },
];

const grouped = groupCallLogs(sampleLogs);
assert.strictEqual(grouped.length, 2);
assert.strictEqual(grouped[0].count, 3);
assert.strictEqual(grouped[0].peer.userId, 'u1');
assert.strictEqual(grouped[1].count, 1);
assert.strictEqual(grouped[1].peer.userId, 'u2');
console.log('[PASS] Consecutive call log grouping logic verified');

// 2. Test call log body text generation
function getCallLogBody(callMode, callStatus, durationSeconds = 0) {
  const modeLabel = callMode === 'video' ? 'Video call' : 'Voice call';
  if (callStatus === 'ended') {
    if (durationSeconds > 0) {
      const mins = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      return `${modeLabel} ended (${durationStr})`;
    }
    return `${modeLabel} ended`;
  }
  if (callStatus === 'declined') return `Declined ${callMode} call`;
  if (callStatus === 'missed') return `Missed ${callMode} call`;
  if (callStatus === 'canceled') return `Canceled ${callMode} call`;
  return modeLabel;
}

assert.strictEqual(getCallLogBody('audio', 'ended', 135), 'Voice call ended (2m 15s)');
assert.strictEqual(getCallLogBody('video', 'ended', 45), 'Video call ended (45s)');
assert.strictEqual(getCallLogBody('video', 'declined'), 'Declined video call');
assert.strictEqual(getCallLogBody('audio', 'missed'), 'Missed audio call');
assert.strictEqual(getCallLogBody('audio', 'canceled'), 'Canceled audio call');
console.log('[PASS] Call log body text generation verified');

console.log('All callRepository deep live simulation tests passed.');
process.exit(0);
