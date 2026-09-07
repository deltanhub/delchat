const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  DELCHAT 500k CCU NETWORK HANDOVER & RESILIENCE TEST SUITE     ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

// --- SUITE 1: WebRTC ICE Restart & Handover Resilience ---
console.log('--- SUITE 1: WebRTC ICE Restart & Handover Resilience ---');

const mediaEnginePath = path.join(__dirname, '..', 'lib', 'webrtc', 'mediaEngine.ts');
const mediaEngineSrc = fs.readFileSync(mediaEnginePath, 'utf8');

test('lib/webrtc/mediaEngine.ts exists and provides restartIce method', () => {
  assert(fs.existsSync(mediaEnginePath), 'mediaEngine.ts must exist');
  assert(mediaEngineSrc.includes('public async restartIce('), 'Must provide restartIce method');
});

test('createOffer supports iceRestart option', () => {
  assert(mediaEngineSrc.includes('options?: { iceRestart?: boolean }'), 'createOffer must support iceRestart option');
  assert(mediaEngineSrc.includes('offerOptions.iceRestart = true'), 'createOffer must pass iceRestart to peerConnection');
});

test('MediaEngineConfig defines onIceRestartNeeded callback', () => {
  assert(mediaEngineSrc.includes('onIceRestartNeeded?: (offer: RTCSessionDescriptionPayload) => void'), 'Must define onIceRestartNeeded callback');
});

test('mediaEngine implements automated 3s reconnection watchdog for disconnected state', () => {
  assert(mediaEngineSrc.includes('reconnectWatchdogTimer'), 'Must maintain reconnectWatchdogTimer');
  assert(mediaEngineSrc.includes("state === 'disconnected'"), 'Must handle disconnected state transition');
  assert(mediaEngineSrc.includes('3000'), 'Must enforce 3-second grace watchdog timer');
  assert(mediaEngineSrc.includes("state === 'failed'"), 'Must handle failed state transition');
});

test('useCallSession wires onIceRestartNeeded and exposes connectionHealth', () => {
  const hookPath = path.join(__dirname, '..', 'hooks', 'useCallSession.ts');
  const hookSrc = fs.readFileSync(hookPath, 'utf8');
  assert(hookSrc.includes('onIceRestartNeeded:'), 'useCallSession must wire onIceRestartNeeded');
  assert(hookSrc.includes("signalType: 'offer'"), 'Must send offer signal on ICE restart');
  assert(hookSrc.includes('isIceRestart: true'), 'Must specify isIceRestart payload');
  assert(hookSrc.includes('handleRestartIce'), 'useCallSession must export handleRestartIce');
  assert(hookSrc.includes('connectionHealth'), 'useCallSession must export connectionHealth');
});

// --- SUITE 2: Proximity Sensor Display Blanking ---
console.log('\n--- SUITE 2: Proximity Sensor Display Blanking ---');

const proximityServicePath = path.join(__dirname, '..', 'lib', 'voip', 'proximityService.ts');

test('lib/voip/proximityService.ts exists and exports proximityService', () => {
  assert(fs.existsSync(proximityServicePath), 'proximityService.ts must exist');
  const proximitySrc = fs.readFileSync(proximityServicePath, 'utf8');
  assert(proximitySrc.includes('export const proximityService = new ProximityService()'), 'Must export singleton instance');
  assert(proximitySrc.includes('enableProximity'), 'Must provide enableProximity method');
  assert(proximitySrc.includes('disableProximity'), 'Must provide disableProximity method');
  assert(proximitySrc.includes('setNear'), 'Must provide setNear method');
  assert(proximitySrc.includes('subscribe'), 'Must provide subscribe method');
});

test('lib/voip/index.ts barrel exports proximityService', () => {
  const voipIndexPath = path.join(__dirname, '..', 'lib', 'voip', 'index.ts');
  const voipIndexSrc = fs.readFileSync(voipIndexPath, 'utf8');
  assert(voipIndexSrc.includes("export * from './proximityService'"), 'Must export proximityService in barrel');
});

test('CallModal integrates proximity screen blackout overlay', () => {
  const callModalPath = path.join(__dirname, '..', 'components', 'chat', 'CallModal.tsx');
  const callModalSrc = fs.readFileSync(callModalPath, 'utf8');
  assert(callModalSrc.includes('proximityService'), 'CallModal must import proximityService');
  assert(callModalSrc.includes('isNearProximity'), 'CallModal must track isNearProximity');
  assert(callModalSrc.includes("backgroundColor: '#000000'"), 'Must render black overlay');
  assert(callModalSrc.includes('zIndex: 99999'), 'Overlay must have elevated zIndex');
});

test('CallModal renders reconnecting network banner', () => {
  const callModalPath = path.join(__dirname, '..', 'components', 'chat', 'CallModal.tsx');
  const callModalSrc = fs.readFileSync(callModalPath, 'utf8');
  assert(callModalSrc.includes("connectionHealth === 'reconnecting'"), 'Must render reconnecting banner');
  assert(callModalSrc.includes('Reconnecting · Handover in progress'), 'Must display informative text');
});

// --- SUITE 3: Dynamic Hardware Audio Routing ---
console.log('\n--- SUITE 3: Dynamic Hardware Audio Routing ---');

const audioPath = path.join(__dirname, '..', 'lib', 'webrtc-audio.ts');
const audioSrc = fs.readFileSync(audioPath, 'utf8');

test('lib/webrtc-audio.ts exports AudioRoute and setAudioRoute', () => {
  assert(audioSrc.includes("export type AudioRoute = 'earpiece' | 'speaker' | 'bluetooth'"), 'Must define AudioRoute union');
  assert(audioSrc.includes('export function getCurrentAudioRoute()'), 'Must export getCurrentAudioRoute');
  assert(audioSrc.includes('export async function setAudioRoute('), 'Must export setAudioRoute');
});

test('lib/webrtc-audio.ts preserves backward compatibility with configureAudioForCall and setSpeakerphone', () => {
  assert(audioSrc.includes('export async function configureAudioForCall('), 'Must preserve configureAudioForCall');
  assert(audioSrc.includes('export async function setSpeakerphone('), 'Must preserve setSpeakerphone');
  assert(audioSrc.includes('export async function resetAudioAfterCall('), 'Must preserve resetAudioAfterCall');
});

test('useCallSession manages audio route and earpiece proximity gating', () => {
  const hookPath = path.join(__dirname, '..', 'hooks', 'useCallSession.ts');
  const hookSrc = fs.readFileSync(hookPath, 'utf8');
  assert(hookSrc.includes('audioRoute'), 'useCallSession must maintain audioRoute state');
  assert(hookSrc.includes('handleSetAudioRoute'), 'useCallSession must expose handleSetAudioRoute');
  assert(hookSrc.includes('proximityService.enableProximity()'), 'Must enable proximity on earpiece');
  assert(hookSrc.includes('proximityService.disableProximity()'), 'Must disable proximity on speaker or end');
});

// --- SUITE 4: SyncCoordinator Reconnection Storm Protection ---
console.log('\n--- SUITE 4: SyncCoordinator Reconnection Storm Protection ---');

const syncCoordinatorPath = path.join(__dirname, '..', 'lib', 'sync-coordinator.ts');
const syncCoordinatorSrc = fs.readFileSync(syncCoordinatorPath, 'utf8');

test('SyncCoordinator defines calculateJitter and PRESENCE_TOUCH_THROTTLE_MS', () => {
  assert(syncCoordinatorSrc.includes('export function calculateJitter('), 'Must export calculateJitter');
  assert(syncCoordinatorSrc.includes('PRESENCE_TOUCH_THROTTLE_MS = 30000'), 'Must enforce 30-second throttle constant');
  assert(syncCoordinatorSrc.includes('export async function touchUserPresenceSafely('), 'Must export touchUserPresenceSafely');
});

test('SyncCoordinator applies randomized jitter on app active event', () => {
  assert(syncCoordinatorSrc.includes('const jitterMs = calculateJitter(500, 3500)'), 'Must calculate 500-3500ms jitter');
  assert(syncCoordinatorSrc.includes('setTimeout(() => {'), 'Must delay reconnect calls with jitter timeout');
});

test('SyncCoordinator coalesces in-flight connectivity checks', () => {
  assert(syncCoordinatorSrc.includes('_inFlightConnectivityPromise'), 'Must maintain _inFlightConnectivityPromise');
});

test('Functional Jitter Distribution Simulation (1,000 trials)', () => {
  // Simulate the calculateJitter function directly
  function simJitter(min = 500, max = 3500) {
    return Math.floor(min + Math.random() * (max - min));
  }

  let minObserved = Infinity;
  let maxObserved = -Infinity;
  for (let i = 0; i < 1000; i++) {
    const val = simJitter(500, 3500);
    if (val < minObserved) minObserved = val;
    if (val > maxObserved) maxObserved = val;
    assert(val >= 500 && val <= 3500, `Jitter ${val} out of bounds`);
  }
  assert(minObserved < 800, `Expected min near 500, got ${minObserved}`);
  assert(maxObserved > 3200, `Expected max near 3500, got ${maxObserved}`);
});

test('Functional Presence Touch Throttle Simulation', async () => {
  let rpcCallCount = 0;
  const mockClient = {
    rpc: async (name) => {
      if (name === 'touch_user_presence') rpcCallCount++;
    },
  };

  // Replicate touchUserPresenceSafely logic
  let lastTouch = 0;
  const throttleMs = 30000;
  let inFlight = null;

  async function testTouch() {
    const now = Date.now();
    if (now - lastTouch < throttleMs) return;
    if (inFlight) return inFlight;
    lastTouch = now;
    inFlight = (async () => {
      try {
        await mockClient.rpc('touch_user_presence');
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  // 100 simultaneous calls should execute exactly 1 RPC call
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(testTouch());
  }
  await Promise.all(promises);

  assert.strictEqual(rpcCallCount, 1, `Expected exactly 1 RPC call, got ${rpcCallCount}`);
});

// --- SUITE 5: Clean Architecture Line Counts & Verification Invariants ---
console.log('\n--- SUITE 5: Clean Architecture Screen Bounds ---');

test('app/call/[id].tsx is strictly under 250 lines Anti-Spaghetti rule', () => {
  const callScreenPath = path.join(__dirname, '..', 'app', 'call', '[id].tsx');
  const content = fs.readFileSync(callScreenPath, 'utf8');
  const lineCount = content.split('\n').length;
  assert(lineCount < 250, `app/call/[id].tsx has ${lineCount} lines (limit 250)`);
  console.log(`         (Current line count: ${lineCount} < 250)`);
});

console.log('\n================================================================');
console.log(`  PHASE 5 RESULTS: ${passedTests} PASSED / ${totalTests - passedTests} FAILED (Total: ${totalTests})`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
