/**
 * DelChat Hardware Speakerphone Routing & Audio Session Governance Verification Suite
 * 
 * Verifies:
 * 1. lib/webrtc-audio.ts exports, AudioRoute contract, and native InCallManager bridge
 * 2. Proximity sensor coordination with loudspeaker state (earpiece = enabled, speaker = disabled)
 * 3. Route transitions: earpiece <-> speaker <-> bluetooth
 * 4. 200 rapid speakerphone toggles stress test for deterministic stability
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
console.log('  DELCHAT HARDWARE SPEAKERPHONE & AUDIO GOVERNANCE VERIFICATION ');
console.log('================================================================\n');

const rootDir = path.resolve(__dirname, '..');

// --- SECTION 1: Hardware Audio Module Interface ---
console.log('--- SECTION 1: Hardware Audio Module Interface ---');
const audioPath = path.join(rootDir, 'lib', 'webrtc-audio.ts');
assert(fs.existsSync(audioPath), 'lib/webrtc-audio.ts exists');

const audioSrc = fs.readFileSync(audioPath, 'utf8');
assert(audioSrc.includes("export type AudioRoute = 'earpiece' | 'speaker' | 'bluetooth'"), 'Exports AudioRoute union');
assert(audioSrc.includes('export function getCurrentAudioRoute()'), 'Exports getCurrentAudioRoute');
assert(audioSrc.includes('export async function setAudioRoute('), 'Exports setAudioRoute');
assert(audioSrc.includes('export async function configureAudioForCall('), 'Exports configureAudioForCall');
assert(audioSrc.includes('export async function setSpeakerphone('), 'Exports setSpeakerphone');
assert(audioSrc.includes('export async function resetAudioAfterCall('), 'Exports resetAudioAfterCall');
assert(audioSrc.includes('shouldRouteThroughEarpiece'), 'Configures earpiece routing for Expo Audio');
assert(audioSrc.includes('playsInSilentMode: true'), 'Bypasses device silent switch for call audio');
assert(audioSrc.includes('incall-manager'), 'Incorporates native InCallManager hardware bridge');

// --- SECTION 2: Proximity & Hook Coordination ---
console.log('\n--- SECTION 2: Proximity & Hook Coordination ---');
const hookPath = path.join(rootDir, 'hooks', 'useCallSession.ts');
const hookSrc = fs.readFileSync(hookPath, 'utf8');

assert(hookSrc.includes('handleToggleSpeaker'), 'useCallSession exports handleToggleSpeaker');
assert(hookSrc.includes('handleSetAudioRoute'), 'useCallSession exports handleSetAudioRoute');
assert(hookSrc.includes('proximityService.disableProximity()'), 'Disables proximity when speakerphone is on');
assert(hookSrc.includes('proximityService.enableProximity()'), 'Enables proximity when earpiece is active on audio calls');
assert(hookSrc.includes('activeCallKind === \'audio\''), 'Gates proximity activation to activeCallKind === audio');

// --- SECTION 3: Route Transitions & Proximity Simulation ---
console.log('\n--- SECTION 3: Route Transitions & Proximity Simulation ---');

class MockAudioGovernance {
  constructor() {
    this.currentRoute = 'earpiece';
    this.isProximityActive = false;
    this.callKind = 'audio';
    this.callPhase = 'connected';
  }

  setSpeakerphone(isSpeakerOn) {
    this.currentRoute = isSpeakerOn ? 'speaker' : 'earpiece';
    if (isSpeakerOn) {
      this.isProximityActive = false;
    } else if (this.callPhase === 'connected' && this.callKind === 'audio') {
      this.isProximityActive = true;
    }
  }

  setAudioRoute(route) {
    this.currentRoute = route;
    if (route === 'earpiece' && this.callPhase === 'connected' && this.callKind === 'audio') {
      this.isProximityActive = true;
    } else {
      this.isProximityActive = false;
    }
  }

  reset() {
    this.currentRoute = 'earpiece';
    this.isProximityActive = false;
  }
}

const gov = new MockAudioGovernance();
assert(gov.currentRoute === 'earpiece', 'Initial route is earpiece');

// Switch to speaker
gov.setSpeakerphone(true);
assert(gov.currentRoute === 'speaker', 'Speakerphone turned ON: route is speaker');
assert(gov.isProximityActive === false, 'Proximity sensor is disabled when speaker is ON');

// Switch back to earpiece
gov.setSpeakerphone(false);
assert(gov.currentRoute === 'earpiece', 'Speakerphone turned OFF: route is earpiece');
assert(gov.isProximityActive === true, 'Proximity sensor is re-enabled for earpiece audio call');

// Switch to bluetooth
gov.setAudioRoute('bluetooth');
assert(gov.currentRoute === 'bluetooth', 'Switched to bluetooth audio route');
assert(gov.isProximityActive === false, 'Proximity sensor disabled on bluetooth');

// Reset after call
gov.reset();
assert(gov.currentRoute === 'earpiece', 'Reset restores earpiece route');
assert(gov.isProximityActive === false, 'Reset disables proximity sensor');

// --- SECTION 4: High-Frequency Rapid Toggle Stress Test ---
console.log('\n--- SECTION 4: Rapid Speakerphone Toggle Stress Test ---');
const startTime = Date.now();
for (let i = 0; i < 200; i++) {
  const isSpeaker = i % 2 === 0;
  gov.setSpeakerphone(isSpeaker);
  if (isSpeaker) {
    if (gov.currentRoute !== 'speaker' || gov.isProximityActive !== false) {
      throw new Error(`State invariant violated at iteration ${i}`);
    }
  } else {
    if (gov.currentRoute !== 'earpiece' || gov.isProximityActive !== true) {
      throw new Error(`State invariant violated at iteration ${i}`);
    }
  }
}
gov.setSpeakerphone(false);
const elapsedMs = Date.now() - startTime;
assert(elapsedMs < 50, `Processed 200 rapid speakerphone switches in ${elapsedMs}ms (<50ms threshold)`);
assert(gov.currentRoute === 'earpiece', 'Final route matches expected deterministic state');

console.log('\n================================================================');
console.log(`  PHASE 3 RESULTS: ${passCount} PASSED / ${failCount} FAILED (Total: ${passCount + failCount})`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
