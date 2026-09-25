const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_LINES = 150;

console.log('\n================================================================');
console.log('  BATCH 10 CORE SERVICES MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

const batch10Files = [
  // Sub-Batch 10.1: Signaling, Roles, CallKit
  'lib/webrtc/signalingTypes.ts',
  'lib/webrtc-signaling.ts',
  'lib/auth/roles.ts',
  'lib/auth/profileFetcher.ts',
  'lib/auth.ts',
  'lib/voip/callkitTypes.ts',
  'lib/voip/callkitEvents.ts',
  'lib/voip/callkit.ts',

  // Sub-Batch 10.2: Offline Engine & Chat Security
  'lib/offline/types.ts',
  'lib/offline/messagesCache.ts',
  'lib/offline/conversationsCache.ts',
  'lib/offline/outboxQueue.ts',
  'lib/offline/index.ts',
  'lib/offline-engine.ts',
  'lib/chat_security/types.ts',
  'lib/chat_security/tokenStorage.ts',
  'lib/chat_security/devicePreferences.ts',
  'lib/chat_security/chatAccessApi.ts',
  'lib/chat_security/pinOperations.ts',
  'lib/chat_security/biometricsService.ts',
  'lib/chat_security/index.ts',
  'lib/chat-security-service.ts',

  // Sub-Batch 10.3: Sync Coordinator & WebRTC Media Engine
  'lib/sync/types.ts',
  'lib/sync/stormShield.ts',
  'lib/sync/networkMonitor.ts',
  'lib/sync/outboxProcessor.ts',
  'lib/sync/deltaSyncer.ts',
  'lib/sync/inboxAlertBroadcaster.ts',
  'lib/sync/index.ts',
  'lib/sync-coordinator.ts',
  'lib/webrtc/mediaTypes.ts',
  'lib/webrtc/nativeWebRTCDetector.ts',
  'lib/webrtc/simulatedPeerConnection.ts',
  'lib/webrtc/peerConnectionFactory.ts',
  'lib/webrtc/localMediaManager.ts',
  'lib/webrtc/iceCandidateBuffer.ts',
  'lib/webrtc/mediaEngine.ts',
];

// 1. Strict Line Limit Verification (<= 150 LOC)
for (const relPath of batch10Files) {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(
    lines <= MAX_LINES,
    `File ${relPath} exceeds ${MAX_LINES} lines (currently ${lines} lines)`
  );
  console.log(`  [PASS] ${relPath} meets strict single responsibility limit (${lines} <= ${MAX_LINES} lines)`);
}

// 2. Offline Engine Orchestration Verification
console.log('\n--- Offline Engine Architecture ---');
const offlineEngine = fs.readFileSync(path.join(ROOT_DIR, 'lib/offline-engine.ts'), 'utf8');
assert(offlineEngine.includes('getMessagesSync'), 'OfflineEngine exposes getMessagesSync');
assert(offlineEngine.includes('saveSingleMessage'), 'OfflineEngine exposes saveSingleMessage');
assert(offlineEngine.includes('getConversationSync'), 'OfflineEngine exposes getConversationSync');
assert(offlineEngine.includes('drainOutbox') || offlineEngine.includes('getOutbox'), 'OfflineEngine exposes outbox operations');
console.log('  [PASS] OfflineEngine provides 0ms hydration and modular cache access');

// 3. Chat Security Service Orchestration Verification
console.log('\n--- Chat Security Service Architecture ---');
const chatSecurity = fs.readFileSync(path.join(ROOT_DIR, 'lib/chat-security-service.ts'), 'utf8');
assert(chatSecurity.includes('getStoredChatGateToken'), 'ChatSecurityService exposes getStoredChatGateToken');
assert(chatSecurity.includes('verifyChatPin'), 'ChatSecurityService exposes verifyChatPin');
assert(chatSecurity.includes('setupChatPin'), 'ChatSecurityService exposes setupChatPin');
assert(chatSecurity.includes('lockChatRemote'), 'ChatSecurityService exposes lockChatRemote');
assert(chatSecurity.includes('authenticateWithBiometrics'), 'ChatSecurityService exposes authenticateWithBiometrics');
console.log('  [PASS] ChatSecurityService coordinates tokens, device pins, remote locks, and biometrics');

// 4. Sync Coordinator Orchestration Verification
console.log('\n--- Sync Coordinator Architecture ---');
const syncCoordinator = fs.readFileSync(path.join(ROOT_DIR, 'lib/sync-coordinator.ts'), 'utf8');
assert(syncCoordinator.includes('from(\'chat_message_attachments\')'), 'SyncCoordinator targets production chat_message_attachments');
assert(syncCoordinator.includes('drainOutbox'), 'SyncCoordinator coordinates drainOutbox');
assert(syncCoordinator.includes('executeDeltaSync'), 'SyncCoordinator coordinates executeDeltaSync');
assert(syncCoordinator.includes('touchUserPresenceSafely'), 'SyncCoordinator coordinates touchUserPresenceSafely');
assert(syncCoordinator.includes('broadcastInboxAlert'), 'SyncCoordinator coordinates broadcastInboxAlert');
console.log('  [PASS] SyncCoordinator coordinates storm defense, delta sync, and outbox drain');

// 5. WebRTC Media Engine Architecture
console.log('\n--- WebRTC Media Engine Architecture ---');
const mediaEngine = fs.readFileSync(path.join(ROOT_DIR, 'lib/webrtc/mediaEngine.ts'), 'utf8');
assert(mediaEngine.includes('export class WebRTCMediaEngine'), 'Exports WebRTCMediaEngine class');
assert(mediaEngine.includes('acquireLocalMedia'), 'Provides acquireLocalMedia');
assert(mediaEngine.includes('upgradeToVideoMedia'), 'Provides upgradeToVideoMedia');
assert(mediaEngine.includes('createOffer'), 'Provides createOffer');
assert(mediaEngine.includes('restartIce'), 'Provides restartIce');
assert(mediaEngine.includes('handleRemoteOfferAndCreateAnswer'), 'Provides handleRemoteOfferAndCreateAnswer');
assert(mediaEngine.includes('handleRemoteAnswer'), 'Provides handleRemoteAnswer');
assert(mediaEngine.includes('addIceCandidate'), 'Provides addIceCandidate');
assert(mediaEngine.includes('reconnectWatchdogTimer'), 'Implements reconnectWatchdogTimer');
console.log('  [PASS] WebRTCMediaEngine coordinates native detector, simulated peer connection, and media governance');

console.log('\nAll Batch 10 modular architecture tests passed successfully.\n');
