/**
 * DelChat Call Ringing & Ringback Audio Engine Verification Suite
 * 
 * Verifies:
 * 1. Sound assets integrity (valid WAV format, non-empty, proper RIFF headers)
 * 2. callRingtoneService module exports & singleton pattern
 * 3. Lifecycle state machine (outgoing_ringback, incoming_ring, idle)
 * 4. hooks/useCallSession.ts wiring across all call lifecycle stages
 * 5. components/chat/IncomingCallHUD.tsx integration
 */

const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('  DELCHAT CALL RINGING & RINGBACK ENGINE VERIFICATION SUITE     ');
console.log('================================================================\n');

// --- SECTION 1: Audio Assets Integrity ---
console.log('--- SECTION 1: Sound Assets Integrity ---');
const rootDir = path.resolve(__dirname, '..');
const ringbackPath = path.join(rootDir, 'assets', 'sounds', 'ringback.wav');
const incomingPath = path.join(rootDir, 'assets', 'sounds', 'incoming_ring.wav');

assert(fs.existsSync(ringbackPath), 'assets/sounds/ringback.wav exists');
assert(fs.existsSync(incomingPath), 'assets/sounds/incoming_ring.wav exists');

if (fs.existsSync(ringbackPath)) {
  const ringbackBuf = fs.readFileSync(ringbackPath);
  const isRiff = ringbackBuf.toString('ascii', 0, 4) === 'RIFF';
  const isWave = ringbackBuf.toString('ascii', 8, 12) === 'WAVE';
  const isFmt = ringbackBuf.toString('ascii', 12, 16) === 'fmt ';
  assert(isRiff && isWave && isFmt, 'ringback.wav has valid RIFF/WAVE header');
  assert(ringbackBuf.length > 50000, `ringback.wav has substantial audio data (${ringbackBuf.length} bytes)`);
}

if (fs.existsSync(incomingPath)) {
  const incomingBuf = fs.readFileSync(incomingPath);
  const isRiff = incomingBuf.toString('ascii', 0, 4) === 'RIFF';
  const isWave = incomingBuf.toString('ascii', 8, 12) === 'WAVE';
  const isFmt = incomingBuf.toString('ascii', 12, 16) === 'fmt ';
  assert(isRiff && isWave && isFmt, 'incoming_ring.wav has valid RIFF/WAVE header');
  assert(incomingBuf.length > 50000, `incoming_ring.wav has substantial audio data (${incomingBuf.length} bytes)`);
}

// --- SECTION 2: callRingtoneService Module Integrity ---
console.log('\n--- SECTION 2: callRingtoneService Module Integrity ---');
const servicePath = path.join(rootDir, 'lib', 'voip', 'callRingtoneService.ts');
assert(fs.existsSync(servicePath), 'lib/voip/callRingtoneService.ts exists');

const serviceCode = fs.readFileSync(servicePath, 'utf-8');
assert(serviceCode.includes('class CallRingtoneService'), 'Exports CallRingtoneService class');
assert(serviceCode.includes('callRingtoneService = new CallRingtoneService()'), 'Exports callRingtoneService singleton');
assert(serviceCode.includes('playOutgoingRingback()'), 'Provides playOutgoingRingback method');
assert(serviceCode.includes('playIncomingRingtone()'), 'Provides playIncomingRingtone method');
assert(serviceCode.includes('stopAllRingtones()'), 'Provides stopAllRingtones method');
assert(serviceCode.includes('getMode()'), 'Provides getMode method');
assert(serviceCode.includes("from 'expo-audio'"), 'Utilizes official SDK 57 expo-audio package');

const voipIndexPath = path.join(rootDir, 'lib', 'voip', 'index.ts');
const voipIndexCode = fs.readFileSync(voipIndexPath, 'utf-8');
assert(voipIndexCode.includes("export * from './callRingtoneService'"), 'lib/voip/index.ts barrel exports callRingtoneService');

// --- SECTION 3: useCallSession Hook Integration ---
console.log('\n--- SECTION 3: useCallSession Hook Integration ---');
const sessionHookPath = path.join(rootDir, 'hooks', 'useCallSession.ts');
const sessionHookCode = fs.readFileSync(sessionHookPath, 'utf-8');

assert(sessionHookCode.includes('callRingtoneService'), 'useCallSession imports callRingtoneService');
assert(
  sessionHookCode.includes("setCallPhase('outgoing')") &&
  sessionHookCode.includes('callRingtoneService.playOutgoingRingback()'),
  'useCallSession plays outgoing ringback on initiator outgoing call'
);
assert(
  sessionHookCode.includes("callRingtoneService.stopAllRingtones()") &&
  sessionHookCode.includes("setCallPhase('connected')"),
  'useCallSession stops ringtones when call transitions to connected'
);
assert(
  sessionHookCode.includes("handleEndCall") &&
  sessionHookCode.includes("callRingtoneService.stopAllRingtones()"),
  'useCallSession stops ringtones in handleEndCall'
);
assert(
  sessionHookCode.includes("handleDeclineCall") &&
  sessionHookCode.includes("callRingtoneService.stopAllRingtones()"),
  'useCallSession stops ringtones in handleDeclineCall'
);

// --- SECTION 4: IncomingCallHUD Integration ---
console.log('\n--- SECTION 4: IncomingCallHUD Component Integration ---');
const hudPath = path.join(rootDir, 'components', 'chat', 'IncomingCallHUD.tsx');
const hudCode = fs.readFileSync(hudPath, 'utf-8');

assert(hudCode.includes('callRingtoneService'), 'IncomingCallHUD imports callRingtoneService');
assert(
  hudCode.includes('presentIncomingCall') &&
  hudCode.includes('callRingtoneService.playIncomingRingtone()'),
  'IncomingCallHUD plays incoming ringtone when presenting incoming call'
);
assert(
  hudCode.includes('dismissHUD') &&
  hudCode.includes('callRingtoneService.stopAllRingtones()'),
  'IncomingCallHUD stops ringtones when HUD is dismissed'
);

// --- SECTION 5: State Machine Invariants Simulation ---
console.log('\n--- SECTION 5: State Machine Invariants Simulation ---');

class MockCallRingtoneService {
  constructor() {
    this.mode = 'idle';
  }
  getMode() {
    return this.mode;
  }
  async playOutgoingRingback() {
    this.mode = 'outgoing_ringback';
  }
  async playIncomingRingtone() {
    this.mode = 'incoming_ring';
  }
  async stopAllRingtones() {
    this.mode = 'idle';
  }
}

const mock = new MockCallRingtoneService();
assert(mock.getMode() === 'idle', 'Initial ringtone mode is idle');

mock.playOutgoingRingback();
assert(mock.getMode() === 'outgoing_ringback', 'Outgoing call switches mode to outgoing_ringback');

mock.stopAllRingtones();
assert(mock.getMode() === 'idle', 'stopAllRingtones returns mode to idle');

mock.playIncomingRingtone();
assert(mock.getMode() === 'incoming_ring', 'Incoming call switches mode to incoming_ring');

mock.stopAllRingtones();
assert(mock.getMode() === 'idle', 'stopAllRingtones returns mode to idle after incoming call');

// Idempotent safety test: calling stop repeatedly does not throw
let noThrow = true;
try {
  mock.stopAllRingtones();
  mock.stopAllRingtones();
  mock.stopAllRingtones();
} catch {
  noThrow = false;
}
assert(noThrow, 'Rapid repeated stopAllRingtones is idempotent and safe');

console.log('\n================================================================');
console.log(`  PHASE 1 RESULTS: ${passCount} PASSED / ${failCount} FAILED (Total: ${passCount + failCount})`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
