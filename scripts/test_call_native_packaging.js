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
console.log('  DELCHAT WEBRTC NATIVE PACKAGING & EAS READINESS VERIFICATION  ');
console.log('================================================================\n');

// --- SECTION 1: Package Dependencies ---
console.log('--- SECTION 1: Native Package Dependencies ---');
const pkgPath = path.join(__dirname, '..', 'package.json');
assert(fs.existsSync(pkgPath), 'package.json exists');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

assert(!!pkg.dependencies['react-native-webrtc'], 'react-native-webrtc is in package.json dependencies');
assert(!!pkg.dependencies['react-native-incall-manager'], 'react-native-incall-manager is in package.json dependencies');
assert(!!pkg.dependencies['@config-plugins/react-native-webrtc'], '@config-plugins/react-native-webrtc is in package.json dependencies');
assert(!!pkg.dependencies['expo-audio'], 'expo-audio is in package.json dependencies');
assert(!!pkg.dependencies['expo-camera'], 'expo-camera is in package.json dependencies');

// --- SECTION 2: Native App Configuration & Permissions ---
console.log('\n--- SECTION 2: Native App Configuration & Permissions ---');
const appJsonPath = path.join(__dirname, '..', 'app.json');
assert(fs.existsSync(appJsonPath), 'app.json exists');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo;

// iOS Permissions
assert(!!expo.ios?.infoPlist?.NSCameraUsageDescription, 'iOS infoPlist has NSCameraUsageDescription');
assert(!!expo.ios?.infoPlist?.NSMicrophoneUsageDescription, 'iOS infoPlist has NSMicrophoneUsageDescription');
assert(
  Array.isArray(expo.ios?.infoPlist?.UIBackgroundModes) &&
  expo.ios.infoPlist.UIBackgroundModes.includes('audio') &&
  expo.ios.infoPlist.UIBackgroundModes.includes('voip'),
  'iOS infoPlist has audio and voip UIBackgroundModes'
);

// Android Permissions
const androidPerms = expo.android?.permissions || [];
assert(androidPerms.includes('android.permission.CAMERA'), 'Android permissions include CAMERA');
assert(androidPerms.includes('android.permission.RECORD_AUDIO'), 'Android permissions include RECORD_AUDIO');
assert(androidPerms.includes('android.permission.MODIFY_AUDIO_SETTINGS'), 'Android permissions include MODIFY_AUDIO_SETTINGS');
assert(androidPerms.includes('android.permission.BLUETOOTH'), 'Android permissions include BLUETOOTH');
assert(androidPerms.includes('android.permission.FOREGROUND_SERVICE'), 'Android permissions include FOREGROUND_SERVICE');
assert(androidPerms.includes('android.permission.FOREGROUND_SERVICE_PHONE_CALL'), 'Android permissions include FOREGROUND_SERVICE_PHONE_CALL');
assert(androidPerms.includes('android.permission.MANAGE_OWN_CALLS'), 'Android permissions include MANAGE_OWN_CALLS');
assert(androidPerms.includes('android.permission.WAKE_LOCK'), 'Android permissions include WAKE_LOCK');

// Config Plugins
const plugins = expo.plugins || [];
const webrtcPlugin = plugins.find(p => Array.isArray(p) && p[0] === '@config-plugins/react-native-webrtc');
assert(!!webrtcPlugin, 'app.json includes @config-plugins/react-native-webrtc plugin');
assert(!!webrtcPlugin?.[1]?.cameraPermission, 'WebRTC config plugin configures cameraPermission');
assert(!!webrtcPlugin?.[1]?.microphonePermission, 'WebRTC config plugin configures microphonePermission');

// --- SECTION 3: WebRTC Subsystem Resilience ---
console.log('\n--- SECTION 3: WebRTC Subsystem Resilience ---');
const mediaEnginePath = path.join(__dirname, '..', 'lib', 'webrtc', 'mediaEngine.ts');
assert(fs.existsSync(mediaEnginePath), 'lib/webrtc/mediaEngine.ts exists');
const mediaEngineContent = fs.readFileSync(mediaEnginePath, 'utf8');
assert(mediaEngineContent.includes("require('react-native-webrtc')"), 'WebRTCMediaEngine dynamically imports react-native-webrtc');
assert(mediaEngineContent.includes('isNativeModuleAvailable'), 'WebRTCMediaEngine guards native module availability');

const audioPath = path.join(__dirname, '..', 'lib', 'webrtc-audio.ts');
assert(fs.existsSync(audioPath), 'lib/webrtc-audio.ts exists');
const audioContent = fs.readFileSync(audioPath, 'utf8');
assert(audioContent.includes("require('react-native-incall-manager')"), 'webrtc-audio dynamically imports react-native-incall-manager');
assert(audioContent.includes('setSpeakerphone'), 'webrtc-audio provides setSpeakerphone bridge');

// --- SECTION 4: EAS Build Configuration ---
console.log('\n--- SECTION 4: EAS Build Configuration ---');
const easJsonPath = path.join(__dirname, '..', 'eas.json');
assert(fs.existsSync(easJsonPath), 'eas.json exists');
const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
assert(!!easJson.build?.production, 'eas.json defines production build profile');
assert(easJson.build.production.android?.buildType === 'app-bundle', 'eas.json production builds Android App Bundle');

console.log('\n================================================================');
console.log(`  PHASE 4 RESULTS: ${passedTests} PASSED / ${failedTests} FAILED (Total: ${passedTests + failedTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
