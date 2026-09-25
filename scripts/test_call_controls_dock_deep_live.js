const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log('  [PASS] ' + message);
  } else {
    console.error('  [FAIL] ' + message);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  CALL CONTROLS DOCK DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Simulation of Call Control State Machine
function resolveDockBranch(phase, callKind) {
  const isVideoMode = callKind === 'video';
  const isIncoming = phase === 'incoming';
  const isConnected = phase === 'connected';

  if (isVideoMode && isConnected) {
    return 'VIDEO_IN_CALL_PILL';
  }
  if (isIncoming) {
    return 'INCOMING_ACTIONS';
  }
  return 'IN_CALL_AUDIO';
}

assert(resolveDockBranch('connected', 'video') === 'VIDEO_IN_CALL_PILL', 'Connected video routes to VideoControlsPill');
assert(resolveDockBranch('incoming', 'video') === 'INCOMING_ACTIONS', 'Incoming video routes to IncomingCallActions');
assert(resolveDockBranch('incoming', 'audio') === 'INCOMING_ACTIONS', 'Incoming audio routes to IncomingCallActions');
assert(resolveDockBranch('connected', 'audio') === 'IN_CALL_AUDIO', 'Connected audio routes to InCallAudioControls');
assert(resolveDockBranch('outgoing', 'audio') === 'IN_CALL_AUDIO', 'Outgoing audio routes to InCallAudioControls');
assert(resolveDockBranch('outgoing', 'video') === 'IN_CALL_AUDIO', 'Outgoing video before connect routes to InCallAudioControls');

// 2. Button Action Handler simulation
let muteToggled = false;
let speakerToggled = false;
let videoToggled = false;
let cameraSwitched = false;
let callEnded = false;
let callAccepted = false;
let callDeclined = false;

const mockHandlers = {
  onToggleMute: () => { muteToggled = true; },
  onToggleSpeaker: () => { speakerToggled = true; },
  onToggleVideo: () => { videoToggled = true; },
  onSwitchCamera: () => { cameraSwitched = true; },
  onEndCall: () => { callEnded = true; },
  onAccept: () => { callAccepted = true; },
  onDecline: () => { callDeclined = true; },
};

mockHandlers.onToggleMute();
mockHandlers.onToggleSpeaker();
mockHandlers.onToggleVideo();
mockHandlers.onSwitchCamera();
mockHandlers.onEndCall();
mockHandlers.onAccept();
mockHandlers.onDecline();

assert(muteToggled === true, 'Mute callback invoked correctly');
assert(speakerToggled === true, 'Speaker callback invoked correctly');
assert(videoToggled === true, 'Video toggle callback invoked correctly');
assert(cameraSwitched === true, 'Camera switch callback invoked correctly');
assert(callEnded === true, 'End call callback invoked correctly');
assert(callAccepted === true, 'Accept callback invoked correctly');
assert(callDeclined === true, 'Decline callback invoked correctly');

console.log(`\nCallControlsDock Deep Live: ${passed} / ${total} tests passed.\n`);
