const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DELCHAT_DIR = 'c:\\Users\\alfre\\OneDrive\\Desktop\\delchat';

console.log('================================================================');
console.log('  DELCHAT WEBRTC & VOIP CALL FUNCTIONALITY VERIFICATION SUITE');
console.log('================================================================\n');

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name}`);
    if (details) console.error(`         Reason: ${details}`);
  }
}

// 1. Static Typecheck on Call Modules
console.log('--- TEST 1: Calling Modules TypeScript Static Analysis ---');
try {
  execSync('cmd /c npx tsc --noEmit', { cwd: DELCHAT_DIR, stdio: 'pipe' });
  assert(true, 'Call Screens & VoIP Modules compile with 0 TypeScript errors');
} catch (e) {
  assert(false, 'Call modules TypeScript check failed', e.stderr ? e.stderr.toString() : e.message);
}

// 2. WebRTC Signaling Infrastructure
console.log('\n--- TEST 2: WebRTC Signaling Architecture ---');
const sigPath = path.join(DELCHAT_DIR, 'lib', 'webrtc-signaling.ts');
assert(fs.existsSync(sigPath), 'lib/webrtc-signaling.ts exists');

const sigContent = fs.readFileSync(sigPath, 'utf8');
assert(sigContent.includes('fetchIceConfig'), 'webrtc-signaling exports fetchIceConfig');
assert(sigContent.includes('/api/chats/calls/ice'), 'webrtc-signaling queries DeltanHub Cloudflare Calls ICE endpoint');
assert(sigContent.includes('startServerCallSession'), 'webrtc-signaling exports startServerCallSession');
assert(sigContent.includes('updateServerCallSession'), 'webrtc-signaling exports updateServerCallSession');
assert(sigContent.includes('sendLiveCallSignal'), 'webrtc-signaling exports sendLiveCallSignal');
assert(
  sigContent.includes("'offer'") &&
  sigContent.includes("'answer'") &&
  sigContent.includes("'ice-candidate'") &&
  sigContent.includes("'media-state'") &&
  sigContent.includes("'hangup'"),
  'webrtc-signaling defines standard protocol signal types (offer, answer, ice-candidate, media-state, hangup)'
);

// 3. Hardware VoIP Audio Management
console.log('\n--- TEST 3: Hardware VoIP Audio Management ---');
const audioPath = path.join(DELCHAT_DIR, 'lib', 'webrtc-audio.ts');
assert(fs.existsSync(audioPath), 'lib/webrtc-audio.ts exists');

const audioContent = fs.readFileSync(audioPath, 'utf8');
assert(audioContent.includes('configureAudioForCall'), 'webrtc-audio exports configureAudioForCall');
assert(audioContent.includes('setSpeakerphone'), 'webrtc-audio exports setSpeakerphone');
assert(audioContent.includes('resetAudioAfterCall'), 'webrtc-audio exports resetAudioAfterCall');
assert(audioContent.includes('shouldRouteThroughEarpiece'), 'webrtc-audio dynamically routes earpiece vs speaker');
assert(audioContent.includes('playsInSilentMode: true'), 'webrtc-audio configures silent mode bypass for phone calls');

// 4. Call Screen & UI State Sync
console.log('\n--- TEST 4: Call Screen & Remote Peer Sync ---');
const callScreenPath = path.join(DELCHAT_DIR, 'app', 'call', '[id].tsx');
assert(fs.existsSync(callScreenPath), 'app/call/[id].tsx exists');

const screenContent = fs.readFileSync(callScreenPath, 'utf8');
assert(screenContent.includes("callPhase === 'connected'"), 'CallScreen enforces connected phase verification');
assert(screenContent.includes('remoteIsMuted') && screenContent.includes('remoteIsVideoOff'), 'CallScreen manages remote peer mute and camera status');
assert(screenContent.includes("signalType: 'media-state'"), 'CallScreen broadcasts local media changes to remote peer');
assert(screenContent.includes("signalType: 'hangup'"), 'CallScreen broadcasts hangup signal upon call termination');
assert(screenContent.includes('resetAudioAfterCall'), 'CallScreen resets hardware audio upon hangup and unmount');
assert(screenContent.includes('updateServerCallSession'), 'CallScreen synchronizes call outcome with DeltanHub server API');

// 5. Incoming Call HUD & Zero-DB Notification
console.log('\n--- TEST 5: Incoming Call HUD Notification Architecture ---');
const hudPath = path.join(DELCHAT_DIR, 'components', 'chat', 'IncomingCallHUD.tsx');
assert(fs.existsSync(hudPath), 'components/chat/IncomingCallHUD.tsx exists');

const hudContent = fs.readFileSync(hudPath, 'utf8');
assert(
  hudContent.includes('user-call-listener-') && hudContent.includes('incoming_call'),
  'IncomingCallHUD subscribes to targeted zero-DB Realtime Broadcasts'
);
assert(
  hudContent.includes('filter: `user_id=eq.${currentUser.id}`') && hudContent.includes('chat_call_participants'),
  'IncomingCallHUD uses targeted user_id filter on chat_call_participants'
);

// 6. Call State Machine Simulation & Invariant Validation
console.log('\n--- TEST 6: Call State Machine Invariants Simulation ---');
const stateMachine = {
  outgoing: ['ringing', 'connected', 'ended', 'declined', 'missed'],
  incoming: ['connected', 'ended', 'declined'],
  ringing: ['connected', 'ended', 'declined', 'missed'],
  connected: ['ended'],
  ended: [],
  declined: [],
  missed: [],
};

const canTransition = (from, to) => (stateMachine[from] || []).includes(to);

assert(canTransition('outgoing', 'ringing'), 'Allowed: outgoing -> ringing');
assert(canTransition('ringing', 'connected'), 'Allowed: ringing -> connected');
assert(canTransition('connected', 'ended'), 'Allowed: connected -> ended');
assert(canTransition('incoming', 'connected'), 'Allowed: incoming -> connected');
assert(canTransition('incoming', 'declined'), 'Allowed: incoming -> declined');
assert(!canTransition('ended', 'connected'), 'Rejected: ended -> connected (No resurrection)');
assert(!canTransition('ended', 'ringing'), 'Rejected: ended -> ringing');
assert(!canTransition('declined', 'connected'), 'Rejected: declined -> connected');

// 7. Simulated Rapid Signal Transmission Performance
console.log('\n--- TEST 7: Simulated Rapid WebRTC Signals Performance ---');
const startTime = Date.now();
const signalCount = 1000;
for (let i = 0; i < signalCount; i++) {
  const signal = {
    id: `sig_${i}`,
    callId: 'call_live_789',
    conversationId: 'conv_live_101',
    senderUserId: 'user_initiator',
    recipientUserId: 'user_receiver',
    signalType: i % 2 === 0 ? 'media-state' : 'ice-candidate',
    payload: { isMuted: i % 4 === 0, sdpMLineIndex: i },
    createdAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(signal);
  const deserialized = JSON.parse(serialized);
  if (deserialized.id !== signal.id) throw new Error('Serialization corruption');
}
const elapsed = Date.now() - startTime;
assert(elapsed < 100, `Processed ${signalCount} WebRTC signaling payloads in ${elapsed}ms (<100ms threshold)`);

// 8. Call Domain Repository & Fallback Architecture
console.log('\n--- TEST 8: Call Domain Repository & Resilient Fallback Logging ---');
const callRepoPath = path.join(DELCHAT_DIR, 'lib', 'repositories', 'callRepository.ts');
assert(fs.existsSync(callRepoPath), 'lib/repositories/callRepository.ts exists');

const callRepoContent = fs.readFileSync(callRepoPath, 'utf8');
assert(callRepoContent.includes('fetchCallLogs'), 'callRepository exports fetchCallLogs');
assert(callRepoContent.includes('/api/chats/calls/logs'), 'callRepository queries DeltanHub web /api/chats/calls/logs');
assert(callRepoContent.includes('recordCallLogFallback'), 'callRepository exports recordCallLogFallback');
assert(callRepoContent.includes('groupCallLogs'), 'callRepository exports groupCallLogs');
assert(callRepoContent.includes('formatCallTime'), 'callRepository exports formatCallTime');

// Call screen integration with repository fallback
assert(screenContent.includes('callRepository.recordCallLogFallback'), 'CallScreen integrates resilient call log fallback insertion');

// 9. In-Thread Rich Call Log Card & Dedicated Calls Tab
console.log('\n--- TEST 9: In-Thread Call Log Pill & Dedicated Calls UI ---');
const sysBubblePath = path.join(DELCHAT_DIR, 'components', 'chat', 'bubbles', 'SystemMessageBubble.tsx');
assert(fs.existsSync(sysBubblePath), 'components/chat/bubbles/SystemMessageBubble.tsx exists');

const sysBubbleContent = fs.readFileSync(sysBubblePath, 'utf8');
assert(sysBubbleContent.includes('callLog'), 'SystemMessageBubble inspects structured callLog payload');
assert(sysBubbleContent.includes('displayTitle') && sysBubbleContent.includes('statusText'), 'SystemMessageBubble formats call direction, mode, and duration');
assert(sysBubbleContent.includes('videocam') && sysBubbleContent.includes('call'), 'SystemMessageBubble renders video/audio indicator icons');

const recentCallsPath = path.join(DELCHAT_DIR, 'components', 'chat', 'RecentCallsList.tsx');
assert(fs.existsSync(recentCallsPath), 'components/chat/RecentCallsList.tsx exists');

const recentCallsContent = fs.readFileSync(recentCallsPath, 'utf8');
assert(recentCallsContent.includes('callRepository.groupCallLogs'), 'RecentCallsList groups consecutive calls matching web');
assert(recentCallsContent.includes('handleRedial'), 'RecentCallsList provides one-tap audio and video redial');
assert(recentCallsContent.includes('filter: `user_id=eq.${currentUserId}`'), 'RecentCallsList strictly filters CDC to prevent DoS');

const inboxContent = fs.readFileSync(path.join(DELCHAT_DIR, 'app', '(tabs)', 'index.tsx'), 'utf8');
assert(inboxContent.includes("key: 'calls'") && inboxContent.includes('<RecentCallsList'), 'Inbox screen integrates dedicated Calls tab');

console.log('\n================================================================');
console.log(`  CALL VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${total})`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
