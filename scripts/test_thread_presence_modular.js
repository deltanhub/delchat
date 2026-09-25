const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'hooks/useThreadPresence.ts',
  'hooks/presence/index.ts',
  'hooks/presence/types.ts',
  'hooks/presence/usePresenceSync.ts',
  'hooks/presence/useTypingBroadcast.ts',
];

console.log('\n--- Thread Presence Domain Hook Modular Architecture Audit ---');
let passed = 0;

function check(cond, msg) {
  assert(cond, msg);
  console.log(`  [PASS] ${msg}`);
  passed++;
}

for (const f of files) {
  const full = path.join(ROOT, f);
  check(fs.existsSync(full), `${f} exists`);
  const lines = fs.readFileSync(full, 'utf8').split('\n').length;
  check(lines <= 150, `${f} strictly <= 150 LOC (${lines} lines)`);
}

const mainContent = fs.readFileSync(path.join(ROOT, 'hooks/useThreadPresence.ts'), 'utf8');
check(mainContent.includes('export function useThreadPresence'), 'useThreadPresence export present');
check(mainContent.includes('usePresenceSync'), 'Delegates to usePresenceSync');
check(mainContent.includes('useTypingBroadcast'), 'Delegates to useTypingBroadcast');
check(mainContent.includes('formatWhatsAppLastSeen'), 'Formats lastSeenText with formatWhatsAppLastSeen');

console.log(`\nThread Presence Modular Architecture: ${passed} / ${passed} tests passed.\n`);
