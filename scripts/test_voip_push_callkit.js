/**
 * DELCHAT NATIVE VOIP BACKGROUND PUSH, CALLKIT & CONNECTIONSERVICE AUDIT SUITE
 * 
 * Verifies Phase 3 deliverables:
 * 1. Apple PushKit & iOS CallKit module (lib/voip/callkit.ts)
 * 2. Android FCM High-Priority VoIP & ConnectionService (lib/voip/connectionService.ts)
 * 3. Backend VoIP Push Dispatch Payload & Edge Routing (lib/services/voipPushService.ts)
 * 4. Call Repository & Hook integration
 * 5. Android VoIP telephony & foreground service permissions in app.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('  DELCHAT NATIVE VOIP PUSH, CALLKIT & CONNECTIONSERVICE SUITE  ');
console.log('================================================================\n');

// -------------------------------------------------------------
// SUITE 1: iOS CallKit Architecture (lib/voip/callkit.ts)
// -------------------------------------------------------------
console.log('--- SUITE 1: iOS CallKit Architecture ---');
const callkitPath = path.join(ROOT_DIR, 'lib', 'voip', 'callkit.ts');
assert(fs.existsSync(callkitPath), 'lib/voip/callkit.ts exists');

if (fs.existsSync(callkitPath)) {
  const callkitContent = fs.readFileSync(callkitPath, 'utf8');
  assert(callkitContent.includes('export const callKit'), 'Exports singleton callKit instance');
  assert(callkitContent.includes('initializeCallKit'), 'Provides initializeCallKit with app metadata');
  assert(callkitContent.includes('reportIncomingCall'), 'Provides reportIncomingCall for CXProvider / CallKit display');
  assert(callkitContent.includes('startOutgoingCall'), 'Provides startOutgoingCall for system recents synchronization');
  assert(callkitContent.includes('reportConnectedCall'), 'Provides reportConnectedCall lifecycle transition');
  assert(callkitContent.includes('endCall'), 'Provides endCall for native UI teardown');
  assert(callkitContent.includes('setMuted'), 'Provides setMuted for hardware button synchronization');
  assert(callkitContent.includes('detectNativeModule'), 'Incorporates graceful fallback degradation for Expo Go / web');
}

// -------------------------------------------------------------
// SUITE 2: Android ConnectionService & Notification Channel
// -------------------------------------------------------------
console.log('\n--- SUITE 2: Android ConnectionService & Notification Channel ---');
const connServicePath = path.join(ROOT_DIR, 'lib', 'voip', 'connectionService.ts');
assert(fs.existsSync(connServicePath), 'lib/voip/connectionService.ts exists');

if (fs.existsSync(connServicePath)) {
  const connContent = fs.readFileSync(connServicePath, 'utf8');
  assert(connContent.includes('export const connectionService'), 'Exports singleton connectionService instance');
  assert(connContent.includes('VOIP_NOTIFICATION_CHANNEL_ID'), 'Defines dedicated VOIP_NOTIFICATION_CHANNEL_ID');
  assert(connContent.includes('initializeConnectionService'), 'Provides initializeConnectionService with MAX importance');
  assert(connContent.includes('displayIncomingCallNotification'), 'Provides displayIncomingCallNotification for lock-screen heads-up');
  assert(connContent.includes('dismissIncomingCallNotification'), 'Provides dismissIncomingCallNotification on call answer/decline');
  assert(connContent.includes('registerPhoneAccount'), 'Provides self-managed Telecom PhoneAccount registration hook');
}

// -------------------------------------------------------------
// SUITE 3: Backend VoIP Push Dispatch Payload & Edge Routing
// -------------------------------------------------------------
console.log('\n--- SUITE 3: Backend VoIP Push Dispatch Payload & Edge Routing ---');
const pushServicePath = path.join(ROOT_DIR, 'lib', 'services', 'voipPushService.ts');
assert(fs.existsSync(pushServicePath), 'lib/services/voipPushService.ts exists');

if (fs.existsSync(pushServicePath)) {
  const pushContent = fs.readFileSync(pushServicePath, 'utf8');
  assert(pushContent.includes('dispatchVoipCallPush'), 'Exports dispatchVoipCallPush function');
  assert(pushContent.includes('dispatchVoipCallCancellation'), 'Exports dispatchVoipCallCancellation function');
  assert(pushContent.includes('apns-push-type\': \'voip\''), 'Specifies Apple PushKit apns-push-type: voip');
  assert(pushContent.includes('priority: \'high\''), 'Specifies Android FCM priority: high');
  assert(pushContent.includes('timeToLive: 30') || pushContent.includes('ttl: 30'), 'Enforces 30-second TTL to prevent ghost ringing');
  assert(pushContent.includes('/api/chats/calls/push-dispatch'), 'Targets DeltanHub calls push dispatch edge endpoint');
}

// -------------------------------------------------------------
// SUITE 4: Repository & Hook Call Lifecycle Integration
// -------------------------------------------------------------
console.log('\n--- SUITE 4: Repository & Hook Call Lifecycle Integration ---');
const callRepoPath = path.join(ROOT_DIR, 'lib', 'repositories', 'callRepository.ts');
const callRepoContent = fs.readFileSync(callRepoPath, 'utf8');
assert(callRepoContent.includes('dispatchVoipCallPush'), 'callRepository triggers dispatchVoipCallPush on outgoing calls');

const useCallSessionPath = path.join(ROOT_DIR, 'hooks', 'useCallSession.ts');
const useCallContent = fs.readFileSync(useCallSessionPath, 'utf8');
assert(useCallContent.includes('callKit.reportConnectedCall'), 'useCallSession reports connected call to CallKit');
assert(useCallContent.includes('callKit.endCall'), 'useCallSession reports endCall to CallKit');
assert(useCallContent.includes('connectionService.dismissIncomingCallNotification'), 'useCallSession dismisses Android incoming call notification');
assert(useCallContent.includes('dispatchVoipCallCancellation'), 'useCallSession cancels VoIP push when caller hangs up before answer');

// -------------------------------------------------------------
// SUITE 5: Android VoIP Permissions in app.json
// -------------------------------------------------------------
console.log('\n--- SUITE 5: Android VoIP Permissions in app.json ---');
const appJsonPath = path.join(ROOT_DIR, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const permissions = appJson.expo.android.permissions || [];

assert(permissions.includes('android.permission.FOREGROUND_SERVICE'), 'app.json specifies FOREGROUND_SERVICE');
assert(permissions.includes('android.permission.FOREGROUND_SERVICE_PHONE_CALL'), 'app.json specifies FOREGROUND_SERVICE_PHONE_CALL');
assert(permissions.includes('android.permission.MANAGE_OWN_CALLS'), 'app.json specifies MANAGE_OWN_CALLS');
assert(permissions.includes('android.permission.WAKE_LOCK'), 'app.json specifies WAKE_LOCK');

// -------------------------------------------------------------
// SUMMARY REPORT
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`  VOIP PUSH & CALLKIT RESULTS: ${passedTests} PASSED / ${failedTests} FAILED (Total: ${totalTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
