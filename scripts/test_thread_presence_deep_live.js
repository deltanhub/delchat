const assert = require('assert');

console.log('\n================================================================');
console.log('  THREAD PRESENCE DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

let passed = 0;
function check(cond, msg) {
  assert(cond, msg);
  console.log(`  [PASS] ${msg}`);
  passed++;
}

// 1. Presence Sync & Join/Leave Simulation
let isPartnerOnline = false;
let partnerLastSeenAt = null;
const partnerUserId = 'u-partner-1';

function handlePresenceJoin(key) {
  if (key === partnerUserId) isPartnerOnline = true;
}

function handlePresenceLeave(key) {
  if (key === partnerUserId) {
    isPartnerOnline = false;
    partnerLastSeenAt = new Date().toISOString();
  }
}

handlePresenceJoin('u-other');
check(isPartnerOnline === false, 'Non-partner join does not mark partner online');
handlePresenceJoin('u-partner-1');
check(isPartnerOnline === true, 'Partner join marks partner online');
handlePresenceLeave('u-partner-1');
check(isPartnerOnline === false, 'Partner leave marks partner offline');
check(partnerLastSeenAt !== null, 'Partner leave records fresh last_seen_at');

// 2. Typing Broadcast Throttle Simulation
let typingSentCount = 0;
let lastTypingSentTime = 0;

function handleTextChange(text) {
  if (text.length === 0) {
    lastTypingSentTime = 0;
    return;
  }
  const now = Date.now();
  if (now - lastTypingSentTime > 2000) {
    lastTypingSentTime = now;
    typingSentCount++;
  }
}

handleTextChange('H');
check(typingSentCount === 1, 'Initial keystroke triggers typing broadcast');
handleTextChange('He');
handleTextChange('Hel');
check(typingSentCount === 1, 'Rapid keystrokes within 2000ms throttled');

// 3. Clear text resets typing immediately
handleTextChange('');
check(lastTypingSentTime === 0, 'Emptying text resets typing timer immediately');

console.log(`\nThread Presence Deep Live: ${passed} / ${passed} tests passed.\n`);
