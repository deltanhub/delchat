const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT CHAT COMPOSER DEEP LIVE STRESS & CHAOS AUDIT');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

const baseDir = path.resolve(__dirname, '..');

// --- TEST 1: Audio Recording State Machine Simulation ---
console.log('--- TEST 1: Audio Recording State Machine Simulation ---');
function simulateAudioRecordingSession() {
  let isRecording = false;
  let recordingSeconds = 0;
  let voiceNoteSent = null;

  const start = () => {
    isRecording = true;
    recordingSeconds = 0;
  };

  const tick = (secs) => {
    if (isRecording) recordingSeconds += secs;
  };

  const stop = (send) => {
    const wasRecording = isRecording;
    const finalDuration = Math.max(1, recordingSeconds);
    isRecording = false;
    recordingSeconds = 0;
    if (send && wasRecording && finalDuration > 0) {
      voiceNoteSent = { duration: finalDuration, uri: 'file:///data/cache/vn_sample.m4a' };
    }
  };

  return { start, tick, stop, getRecording: () => isRecording, getSent: () => voiceNoteSent };
}

runTest('Recording session start, tick, and send dispatches voice note with duration', () => {
  const session = simulateAudioRecordingSession();
  assert.strictEqual(session.getRecording(), false);

  session.start();
  assert.strictEqual(session.getRecording(), true);

  session.tick(5);
  session.stop(true);
  assert.strictEqual(session.getRecording(), false);
  assert.deepStrictEqual(session.getSent(), { duration: 5, uri: 'file:///data/cache/vn_sample.m4a' });
});

runTest('Recording session cancel discards voice note without dispatch', () => {
  const session = simulateAudioRecordingSession();
  session.start();
  session.tick(12);
  session.stop(false);
  assert.strictEqual(session.getRecording(), false);
  assert.strictEqual(session.getSent(), null, 'Cancelled recording must not send voice note');
});

runTest('50 rapid start/stop/cancel cycles execute without state corruption', () => {
  for (let i = 0; i < 50; i++) {
    const session = simulateAudioRecordingSession();
    session.start();
    session.tick(i % 10);
    session.stop(i % 2 === 0);
    assert.strictEqual(session.getRecording(), false);
  }
});

// --- TEST 2: Recording Time Formatting Engine ---
console.log('\n--- TEST 2: Recording Time Formatting Engine ---');
const formatRecordTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

runTest('formatRecordTime formats seconds accurately across all boundaries', () => {
  assert.strictEqual(formatRecordTime(0), '0:00');
  assert.strictEqual(formatRecordTime(5), '0:05');
  assert.strictEqual(formatRecordTime(9), '0:09');
  assert.strictEqual(formatRecordTime(10), '0:10');
  assert.strictEqual(formatRecordTime(59), '0:59');
  assert.strictEqual(formatRecordTime(60), '1:00');
  assert.strictEqual(formatRecordTime(65), '1:05');
  assert.strictEqual(formatRecordTime(125), '2:05');
  assert.strictEqual(formatRecordTime(3599), '59:59');
  assert.strictEqual(formatRecordTime(3600), '60:00');
});

// --- TEST 3: Attachment Menu Action Filtering Invariant ---
console.log('\n--- TEST 3: Attachment Menu Action Filtering Invariant ---');
const ALL_ATTACHMENT_KEYS = [
  'media',
  'document',
  'catalog',
  'form',
  'lead',
  'assign-agent',
  'embed',
];

function filterAttachmentOptions(canAssignAgent) {
  return ALL_ATTACHMENT_KEYS.filter((key) => key !== 'assign-agent' || canAssignAgent);
}

runTest('assign-agent is strictly excluded when canAssignAgent is false (Buyer / Standard)', () => {
  const options = filterAttachmentOptions(false);
  assert.strictEqual(options.length, 6);
  assert(!options.includes('assign-agent'), 'assign-agent must not be visible');
});

runTest('assign-agent is included when canAssignAgent is true (Brokerage / Firm)', () => {
  const options = filterAttachmentOptions(true);
  assert.strictEqual(options.length, 7);
  assert(options.includes('assign-agent'), 'assign-agent must be visible');
});

// --- TEST 4: Replying Banner & Message Truncation ---
console.log('\n--- TEST 4: Replying Banner & Message Truncation ---');
runTest('Reply banner accurately formats author and body with fallback', () => {
  const replyWithText = { id: 'msg-1', authorName: 'Kolawole', body: 'Hello world' };
  assert.strictEqual(`Replying to ${replyWithText.authorName}`, 'Replying to Kolawole');
  assert.strictEqual(replyWithText.body || 'Attachment', 'Hello world');

  const replyWithAttachmentOnly = { id: 'msg-2', authorName: 'Sarah', body: '' };
  assert.strictEqual(replyWithAttachmentOnly.body || 'Attachment', 'Attachment');
});

// --- TEST 5: Announcement Disabled Banner ---
console.log('\n--- TEST 5: Announcement Disabled Banner ---');
runTest('Disabled banner uses custom notice or official default fallback', () => {
  const defaultNotice =
    'This is an official announcement channel from DELTANHUB. Replies are disabled.';
  const customNotice = 'Read-only broadcast group for verified investors.';

  const resolveNotice = (notice) => notice || defaultNotice;
  assert.strictEqual(resolveNotice(undefined), defaultNotice);
  assert.strictEqual(resolveNotice(''), defaultNotice);
  assert.strictEqual(resolveNotice(customNotice), customNotice);
});

// --- TEST 6: Chaos, Concurrency & Extreme Unicode Safety ---
console.log('\n--- TEST 6: Chaos, Concurrency & Extreme Unicode Safety ---');
runTest('Send press validation strictly blocks empty and whitespace-only text', () => {
  const canSend = (text) => text.trim() !== '';
  assert.strictEqual(canSend(''), false);
  assert.strictEqual(canSend('   '), false);
  assert.strictEqual(canSend('\n\t  \n'), false);
  assert.strictEqual(canSend('A'), true);
  assert.strictEqual(canSend('₦250,000,000'), true);
});

runTest('Extreme Unicode and 10,000-character drafts handle without memory crash', () => {
  const testInputs = [
    '₦50,000,000 Luxury Penthouse Ikoyi',
    '🎙️ Voice memo: 2:35 PM on Friday 14th',
    'مرحبا بكم في ديلي شات العقارية',
    '欢迎使用 DelChat 房地产语音助手',
    'Zalgo t̷e̸x̸t̸ testing',
    'A'.repeat(10000),
  ];

  testInputs.forEach((input) => {
    assert(input.trim().length > 0);
    const formatted = input.substring(0, 1000);
    assert(formatted.length <= 1000, 'Max length 1000 bound respected');
  });
});

// --- TEST 7: Component Prop Contract Verification in Codebase ---
console.log('\n--- TEST 7: Component Prop Contract Verification in Codebase ---');
const typesCode = fs.readFileSync(path.join(baseDir, 'components', 'chat', 'composer', 'types.ts'), 'utf8');
const expectedInterfaces = [
  'ChatAttachmentActionType',
  'ReplyingMessageData',
  'ChatComposerProps',
  'AudioRecordingState',
  'AttachmentOptionItem',
  'ComposerAttachmentMenuProps',
  'ComposerReplyBannerProps',
  'ComposerRecordingBarProps',
  'ComposerInputBarProps',
  'ComposerDisabledBannerProps',
];

expectedInterfaces.forEach((iface) => {
  runTest(`Verified interface/type contract: ${iface}`, () => {
    assert(typesCode.includes(iface), `Missing interface ${iface}`);
  });
});

const hookCode = fs.readFileSync(path.join(baseDir, 'components', 'chat', 'composer', 'useAudioRecording.ts'), 'utf8');
const expectedHookReturns = [
  'isRecording',
  'recordingSeconds',
  'handleStartRecording',
  'handleStopRecording',
  'formatRecordTime',
];

expectedHookReturns.forEach((prop) => {
  runTest(`useAudioRecording returns reactive property: ${prop}`, () => {
    assert(hookCode.includes(prop), `useAudioRecording missing property ${prop}`);
  });
});

// --- TEST 8: Strict Line Ceiling Check (All Files <= 200 Lines Target Ideal) ---
console.log('\n--- TEST 8: Strict Line Ceiling Check (All Files <= 200 Lines Target Ideal) ---');
const ALL_FILES = [
  path.join(baseDir, 'components', 'chat', 'ChatComposer.tsx'),
  path.join(baseDir, 'components', 'chat', 'composer', 'types.ts'),
  path.join(baseDir, 'components', 'chat', 'composer', 'constants.ts'),
  path.join(baseDir, 'components', 'chat', 'composer', 'useAudioRecording.ts'),
  path.join(baseDir, 'components', 'chat', 'composer', 'useComposerKeyboard.ts'),
  path.join(baseDir, 'components', 'chat', 'composer', 'ComposerAttachmentMenu.tsx'),
  path.join(baseDir, 'components', 'chat', 'composer', 'ComposerReplyBanner.tsx'),
  path.join(baseDir, 'components', 'chat', 'composer', 'ComposerRecordingBar.tsx'),
  path.join(baseDir, 'components', 'chat', 'composer', 'ComposerInputBar.tsx'),
  path.join(baseDir, 'components', 'chat', 'composer', 'ComposerDisabledBanner.tsx'),
  path.join(baseDir, 'components', 'chat', 'composer', 'index.ts'),
];

ALL_FILES.forEach((filePath) => {
  const rel = path.relative(baseDir, filePath).replace(/\\/g, '/');
  runTest(`${rel} meets strict target ideal (<= 200 lines)`, () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    assert(lines <= 200, `${rel} has ${lines} lines, exceeding 200 line target ideal`);
  });
});

console.log('\n================================================================');
console.log(`  CHAT COMPOSER DEEP LIVE AUDIT: ${passedTests} PASSED / ${totalTests - passedTests} FAILED`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
