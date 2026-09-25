const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

console.log('================================================================');
console.log('  DELCHAT MODULAR CALLING ARCHITECTURE VERIFICATION SUITE      ');
console.log('================================================================\n');

const rootDir = path.resolve(__dirname, '..');

// --- SECTION 1: Atomic UI Components ---
console.log('--- SECTION 1: Atomic UI Components (components/chat/call/) ---');
const components = [
  'CallHeader.tsx',
  'CallAudioStage.tsx',
  'CallVideoStage.tsx',
  'CallPipWindow.tsx',
  'CallControlsDock.tsx',
  'index.ts',
];

components.forEach((comp) => {
  const compPath = path.join(rootDir, 'components', 'chat', 'call', comp);
  assert(fs.existsSync(compPath), `components/chat/call/${comp} exists`);
});

const callModalPath = path.join(rootDir, 'components', 'chat', 'CallModal.tsx');
assert(fs.existsSync(callModalPath), 'components/chat/CallModal.tsx exists');
const callModalLines = fs.readFileSync(callModalPath, 'utf8').split('\n').length;
assert(callModalLines < 250, `CallModal is slim presenter (${callModalLines} lines < 250)`);

// --- SECTION 2: Domain Controller Hooks ---
console.log('\n--- SECTION 2: Domain Controller Hooks (hooks/call/) ---');
const hooks = [
  'useCallSignaling.ts',
  'useCallMedia.ts',
  'useCallAudioGovernance.ts',
  'index.ts',
];

hooks.forEach((hook) => {
  const hookPath = path.join(rootDir, 'hooks', 'call', hook);
  assert(fs.existsSync(hookPath), `hooks/call/${hook} exists`);
});

const signalingSrc = fs.readFileSync(path.join(rootDir, 'hooks', 'call', 'useCallSignaling.ts'), 'utf8');
assert(signalingSrc.includes('outboxQueueRef'), 'useCallSignaling implements outbox queue to prevent dropped packets');
assert(signalingSrc.includes("status === 'SUBSCRIBED'"), 'useCallSignaling coordinates channel subscription confirmation');

const mediaSrc = fs.readFileSync(path.join(rootDir, 'hooks', 'call', 'useCallMedia.ts'), 'utf8');
assert(mediaSrc.includes('upgradeToVideo'), 'useCallMedia provides upgradeToVideo method');
assert(mediaSrc.includes('switchCamera'), 'useCallMedia provides switchCamera method');

const audioGovSrc = fs.readFileSync(path.join(rootDir, 'hooks', 'call', 'useCallAudioGovernance.ts'), 'utf8');
assert(audioGovSrc.includes('toggleSpeaker'), 'useCallAudioGovernance provides toggleSpeaker method');
assert(audioGovSrc.includes('proximityService.enableProximity()'), 'useCallAudioGovernance coordinates proximity sensor');

// --- SECTION 3: Main Hook Coordination ---
console.log('\n--- SECTION 3: Coordinator Hook (hooks/useCallSession.ts) ---');
const sessionHookPath = path.join(rootDir, 'hooks', 'useCallSession.ts');
assert(fs.existsSync(sessionHookPath), 'hooks/useCallSession.ts exists');
const sessionSrc = fs.readFileSync(sessionHookPath, 'utf8');
assert(sessionSrc.includes("from './call'"), 'useCallSession delegates to domain controller hooks');
assert(sessionSrc.includes('useCallMedia'), 'useCallSession incorporates useCallMedia');
assert(sessionSrc.includes('useCallSignaling'), 'useCallSession incorporates useCallSignaling');
assert(sessionSrc.includes('useCallAudioGovernance'), 'useCallSession incorporates useCallAudioGovernance');

console.log('\n================================================================');
console.log(`  MODULAR ARCHITECTURE RESULTS: ${passedTests} PASSED / ${failedTests} FAILED (Total: ${passedTests + failedTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
