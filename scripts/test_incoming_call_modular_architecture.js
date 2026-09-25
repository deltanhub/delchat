/**
 * test_incoming_call_modular_architecture.js
 * Verification of IncomingCallHUD modularization, line limits, and contracts.
 * Strictly <= 200 lines.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
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
console.log('  INCOMING CALL HUD MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every IncomingCallHUD module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/IncomingCallHUD.tsx',
    'components/chat/incoming_call/index.ts',
    'components/chat/incoming_call/types.ts',
    'components/chat/incoming_call/styles.ts',
    'components/chat/incoming_call/IncomingCallCard.tsx',
    'components/chat/incoming_call/incomingCallActions.ts',
    'components/chat/incoming_call/useIncomingCallListener.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/incoming_call/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/incoming_call/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export * from './IncomingCallCard'"));
  assert(content.includes("export * from './incomingCallActions'"));
  assert(content.includes("export * from './useIncomingCallListener'"));
});

// 3. Types verification
test('components/chat/incoming_call/types.ts defines IncomingCallData and Props', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/incoming_call/types.ts'), 'utf8');
  assert(content.includes('export interface IncomingCallData'));
  assert(content.includes('export interface IncomingCallCardProps'));
  assert(content.includes("callMode: 'audio' | 'video'"));
});

// 4. IncomingCallCard UI contract
test('IncomingCallCard satisfies touch targets and accessibility requirements', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/incoming_call/IncomingCallCard.tsx'), 'utf8');
  assert(content.includes('SafeBlurView'));
  assert(content.includes('pulseRing'));
  assert(content.includes('accessibilityLabel="Decline Call"'));
  assert(content.includes('actionBtn'));
  assert(content.includes('declineBtn'));
  assert(content.includes('acceptBtn'));
});

// 5. IncomingCallActions database mutations
test('incomingCallActions handles accept, decline, and busy state updates', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/incoming_call/incomingCallActions.ts'), 'utf8');
  assert(content.includes('acceptCallSession'));
  assert(content.includes('declineCallSession'));
  assert(content.includes('declineCallBusy'));
  assert(content.includes("recipient_declined"));
  assert(content.includes("recipient_busy"));
});

// 6. useIncomingCallListener realtime deduplication
test('useIncomingCallListener implements targeted listener and deduplication', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/incoming_call/useIncomingCallListener.ts'), 'utf8');
  assert(content.includes('user-call-listener-'));
  assert(content.includes('incoming_call'));
  assert(content.includes('supabase.getChannels'));
  assert(content.includes('supabase.removeChannel'));
  assert(content.includes('callRingtoneService.playIncomingRingtone'));
  assert(content.includes('callRingtoneService.stopAllRingtones'));
});

// 7. IncomingCallHUD presenter
test('IncomingCallHUD is a slim presenter orchestrating card and hook under 200 lines', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/IncomingCallHUD.tsx'), 'utf8');
  assert(content.includes('useIncomingCallListener'));
  assert(content.includes('IncomingCallCard'));
  assert(content.includes('pointerEvents="box-none"'));
  assert(content.includes('user-call-listener-'));
  assert(content.includes('incoming_call'));
});

console.log(`\n================================================================`);
console.log(`  ALL ${passed} INCOMING CALL HUD ARCHITECTURE CHECKS PASSED!`);
console.log(`================================================================\n`);
