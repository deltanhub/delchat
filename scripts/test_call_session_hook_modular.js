const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'hooks/useCallSession.ts',
  'hooks/call/session/index.ts',
  'hooks/call/session/types.ts',
  'hooks/call/session/callPartnerResolver.ts',
  'hooks/call/session/useCallSessionState.ts',
  'hooks/call/session/useCallSignalingBridge.ts',
  'hooks/call/session/useCallTermination.ts',
  'hooks/call/session/useCallControls.ts',
  'hooks/call/session/useCallInitLifecycle.ts',
  'hooks/call/session/useCallSessionRealtimeSync.ts',
];

console.log('\n--- Call Session Domain Hook Modular Architecture Audit ---');
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

const mainContent = fs.readFileSync(path.join(ROOT, 'hooks/useCallSession.ts'), 'utf8');
check(mainContent.includes('export function useCallSession'), 'useCallSession export present');
check(mainContent.includes('useCallSessionState'), 'Delegates to useCallSessionState');
check(mainContent.includes('useCallSignalingBridge'), 'Delegates to useCallSignalingBridge');
check(mainContent.includes('useCallTermination'), 'Delegates to useCallTermination');
check(mainContent.includes('useCallControls'), 'Delegates to useCallControls');
check(mainContent.includes('useCallInitLifecycle'), 'Delegates to useCallInitLifecycle');
check(mainContent.includes('useCallSessionRealtimeSync'), 'Delegates to useCallSessionRealtimeSync');

console.log(`\nCall Session Hook Modular Architecture: ${passed} / ${passed} tests passed.\n`);
