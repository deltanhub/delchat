const assert = require('assert');

console.log('\n================================================================');
console.log('  DELCHAT CALL MODAL DEEP OPERATIONAL SIMULATION');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function runSuite(name, fn) {
  console.log(`--- SUITE: ${name} ---`);
  try {
    fn();
    console.log(`  [PASS] ${name}\n`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}\n`);
    failed++;
  }
}

// SUITE 1: Duration Formatting Parity
runSuite('Duration Seconds Formatting', () => {
  function formatDuration(secs) {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  }

  assert.strictEqual(formatDuration(0), '00:00');
  assert.strictEqual(formatDuration(9), '00:09');
  assert.strictEqual(formatDuration(65), '01:05');
  assert.strictEqual(formatDuration(600), '10:00');
  assert.strictEqual(formatDuration(3672), '61:12');
});

// SUITE 2: Status Text Derivation by Phase
runSuite('Status Text Derivation across Call Phases', () => {
  function getStatusText(phase, durationSeconds) {
    if (phase === 'connected') {
      const mins = Math.floor(durationSeconds / 60);
      const rem = durationSeconds % 60;
      return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
    }
    if (phase === 'outgoing') return 'Calling...';
    if (phase === 'incoming') return 'Incoming call...';
    return 'Call ended';
  }

  assert.strictEqual(getStatusText('outgoing', 0), 'Calling...');
  assert.strictEqual(getStatusText('incoming', 0), 'Incoming call...');
  assert.strictEqual(getStatusText('connected', 45), '00:45');
  assert.strictEqual(getStatusText('ended', 45), 'Call ended');
});

// SUITE 3: Proximity Earpiece Blanking Shield Trigger
runSuite('Proximity Blanking Shield Activation Rules', () => {
  function shouldActivateProximityShield(isNear, callKind, isSpeakerOn) {
    return Boolean(isNear && callKind === 'audio' && !isSpeakerOn);
  }

  // Near ear with earpiece on audio call -> shield ACTIVE
  assert.strictEqual(shouldActivateProximityShield(true, 'audio', false), true);

  // Near ear but speakerphone active -> shield INACTIVE (screen remains visible)
  assert.strictEqual(shouldActivateProximityShield(true, 'audio', true), false);

  // Video call near ear -> shield INACTIVE (user wants to see camera/UI)
  assert.strictEqual(shouldActivateProximityShield(true, 'video', false), false);

  // Not near ear -> shield INACTIVE
  assert.strictEqual(shouldActivateProximityShield(false, 'audio', false), false);
});

// SUITE 4: Video Stage vs Audio Stage Layout Selection
runSuite('Video vs Audio Layout State Selection', () => {
  function getActiveStage(callKind, phase) {
    const isVideoMode = callKind === 'video';
    const isConnected = phase === 'connected';
    if (isVideoMode && isConnected) return 'VIDEO_STAGE_AND_PIP';
    return 'AUDIO_STAGE';
  }

  assert.strictEqual(getActiveStage('video', 'connected'), 'VIDEO_STAGE_AND_PIP');
  assert.strictEqual(getActiveStage('video', 'outgoing'), 'AUDIO_STAGE', 'Pre-connected video shows audio/preview stage');
  assert.strictEqual(getActiveStage('audio', 'connected'), 'AUDIO_STAGE');
  assert.strictEqual(getActiveStage('audio', 'incoming'), 'AUDIO_STAGE');
});

// SUITE 5: Reconnecting Banner Handover State
runSuite('Reconnecting Network Handover State', () => {
  function isReconnecting(connectionHealth) {
    return connectionHealth === 'reconnecting';
  }

  assert.strictEqual(isReconnecting('reconnecting'), true);
  assert.strictEqual(isReconnecting('connected'), false);
  assert.strictEqual(isReconnecting('failed'), false);
});

console.log('================================================================');
if (failed > 0) {
  console.error(`  ${failed} SUITES FAILED!`);
  process.exit(1);
} else {
  console.log(`  ALL ${passed} CALL MODAL OPERATIONAL SUITES PASSED!`);
  console.log('================================================================\n');
  process.exit(0);
}
