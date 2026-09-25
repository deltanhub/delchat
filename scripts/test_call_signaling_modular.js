const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'hooks/call/useCallSignaling.ts',
  'hooks/call/signaling/index.ts',
  'hooks/call/signaling/types.ts',
  'hooks/call/signaling/signalOutbox.ts',
  'hooks/call/signaling/signalRouter.ts',
  'hooks/call/signaling/useCallSignalingChannel.ts',
];

console.log('\n--- Call Signaling Domain Hook Modular Architecture Audit ---');
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

const mainContent = fs.readFileSync(path.join(ROOT, 'hooks/call/useCallSignaling.ts'), 'utf8');
check(mainContent.includes('export function useCallSignaling'), 'useCallSignaling export present');
check(mainContent.includes('useCallSignalingChannel'), 'Delegates to useCallSignalingChannel');
check(mainContent.includes('broadcastMediaState'), 'Exports broadcastMediaState');
check(mainContent.includes('broadcastHangup'), 'Exports broadcastHangup');

console.log(`\nCall Signaling Modular Architecture: ${passed} / ${passed} tests passed.\n`);
