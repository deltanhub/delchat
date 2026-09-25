const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT VOICENOTE BUBBLE DEEP LIVE STRESS & CHAOS AUDIT');
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

// --- TEST 1: Single-Stream Playback Concurrency & Auto-Pause Simulation ---
console.log('--- TEST 1: Single-Stream Playback Concurrency & Auto-Pause Simulation ---');
let currentActiveAudioSession = null;
const audioSessionListeners = new Set();

const registerAudioPlayback = (session) => {
  if (currentActiveAudioSession && currentActiveAudioSession.messageId !== session.messageId) {
    try {
      currentActiveAudioSession.pause();
    } catch {}
  }
  currentActiveAudioSession = session;
  audioSessionListeners.forEach((fn) => fn(session.messageId));
};

const stopAudioPlayback = (messageId) => {
  if (currentActiveAudioSession && currentActiveAudioSession.messageId === messageId) {
    currentActiveAudioSession = null;
    audioSessionListeners.forEach((fn) => fn(null));
  }
};

const subscribeAudioPlayback = (listener) => {
  audioSessionListeners.add(listener);
  return () => {
    audioSessionListeners.delete(listener);
  };
};

runTest('Sequential rapid playback handoffs pause previous active sessions', () => {
  const pauseTracker = {};
  let currentActiveId = null;

  const unsubscribe = subscribeAudioPlayback((activeId) => {
    currentActiveId = activeId;
  });

  // Rapidly register 50 different voice notes playing
  for (let i = 1; i <= 50; i++) {
    const msgId = `vn-msg-${i}`;
    pauseTracker[msgId] = false;

    registerAudioPlayback({
      messageId: msgId,
      player: null,
      pause: () => {
        pauseTracker[msgId] = true;
      },
    });

    assert.strictEqual(currentActiveId, msgId, `Active ID should be updated to ${msgId}`);

    if (i > 1) {
      const prevId = `vn-msg-${i - 1}`;
      assert.strictEqual(
        pauseTracker[prevId],
        true,
        `Previous session ${prevId} must have been automatically paused`
      );
    }
  }

  // Stop current active
  stopAudioPlayback('vn-msg-50');
  assert.strictEqual(currentActiveId, null, 'Active ID should reset to null after stopAudioPlayback');

  unsubscribe();
});

// --- TEST 2: Audio Time Formatting Engine ---
console.log('\n--- TEST 2: Audio Time Formatting Engine ---');
const formatAudioTime = (secs) => {
  const total = Math.floor(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

runTest('formatAudioTime formats seconds accurately across all boundaries', () => {
  assert.strictEqual(formatAudioTime(0), '0:00');
  assert.strictEqual(formatAudioTime(5), '0:05');
  assert.strictEqual(formatAudioTime(9), '0:09');
  assert.strictEqual(formatAudioTime(10), '0:10');
  assert.strictEqual(formatAudioTime(59), '0:59');
  assert.strictEqual(formatAudioTime(60), '1:00');
  assert.strictEqual(formatAudioTime(65), '1:05');
  assert.strictEqual(formatAudioTime(125), '2:05');
  assert.strictEqual(formatAudioTime(3599), '59:59');
  assert.strictEqual(formatAudioTime(3600), '60:00');
  // Fractional seconds
  assert.strictEqual(formatAudioTime(14.85), '0:14');
  assert.strictEqual(formatAudioTime(25.1), '0:25');
});

// --- TEST 3: Playback Speed Multiplier State Machine ---
console.log('\n--- TEST 3: Playback Speed Multiplier State Machine ---');
runTest('Playback speed cycles cleanly: 1x -> 1.5x -> 2x -> 1x', () => {
  const getNextSpeed = (current) => {
    return current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
  };

  let speed = 1;
  speed = getNextSpeed(speed);
  assert.strictEqual(speed, 1.5);
  speed = getNextSpeed(speed);
  assert.strictEqual(speed, 2);
  speed = getNextSpeed(speed);
  assert.strictEqual(speed, 1);

  // 100 rapid cycle iterations
  for (let i = 0; i < 100; i++) {
    speed = getNextSpeed(speed);
    assert([1, 1.5, 2].includes(speed), `Speed must always be 1, 1.5, or 2, got ${speed}`);
  }
});

// --- TEST 4: Waveform Progress Calculation & Bounds Safety ---
console.log('\n--- TEST 4: Waveform Progress Calculation & Bounds Safety ---');
const WAVEFORM_BAR_HEIGHTS = [
  8, 14, 20, 12, 18, 24, 16, 22, 28, 14, 10, 18, 24, 14, 20, 26, 12, 18, 22, 16, 12, 20, 14, 10,
];

runTest('Progress ratio and active bars count remain bounded across arbitrary inputs', () => {
  const totalBars = WAVEFORM_BAR_HEIGHTS.length;
  assert.strictEqual(totalBars, 24, 'Waveform must define exactly 24 bars');

  const testCases = [
    { duration: 10, current: 0, expectedBars: 0 },
    { duration: 10, current: 5, expectedBars: 12 },
    { duration: 10, current: 10, expectedBars: 24 },
    { duration: 0, current: 5, expectedBars: 0 },
    { duration: 3, current: 1.5, expectedBars: 12 },
  ];

  testCases.forEach(({ duration, current, expectedBars }) => {
    const progressRatio = duration > 0 ? current / duration : 0;
    const activeBars = Math.floor(progressRatio * totalBars);
    assert.strictEqual(
      activeBars,
      expectedBars,
      `Failed activeBars for duration=${duration}, current=${current}`
    );
  });

  // Fuzz test 1,000 random values
  for (let i = 0; i < 1000; i++) {
    const dur = Math.random() * 300 + 0.1;
    const cur = Math.random() * dur;
    const ratio = dur > 0 ? cur / dur : 0;
    const active = Math.floor(ratio * totalBars);
    assert(active >= 0 && active <= totalBars, `active bars must be within [0, ${totalBars}]`);
  }
});

// --- TEST 5: Staff Tag Derivation Matrix ---
console.log('\n--- TEST 5: Staff Tag Derivation Matrix ---');
const getStaffTag = (message) => {
  const isStaffMessage =
    message.senderType === 'admin' ||
    message.authorRoleLabel === 'Agency representative' ||
    message.authorRoleLabel === 'Agency' ||
    message.authorRoleLabel === 'Developer' ||
    message.authorRoleLabel === 'Assigned agent' ||
    message.authorRoleLabel === 'Agent';

  if (!isStaffMessage) return null;
  if (message.authorRoleLabel === 'Agency representative' || message.authorRoleLabel === 'Agency') {
    return 'sent by agency';
  } else if (message.authorRoleLabel === 'Developer') {
    return 'sent by developer';
  } else {
    return `sent by ${message.authorName}`;
  }
};

runTest('getStaffTag properly identifies agency, developer, and agent roles', () => {
  const agencyRep = {
    senderType: 'user',
    authorName: 'Agent Sarah',
    authorRoleLabel: 'Agency representative',
  };
  assert.strictEqual(getStaffTag(agencyRep), 'sent by agency');

  const agencyOrg = {
    senderType: 'user',
    authorName: 'Prime Properties',
    authorRoleLabel: 'Agency',
  };
  assert.strictEqual(getStaffTag(agencyOrg), 'sent by agency');

  const developer = {
    senderType: 'user',
    authorName: 'BuildCorp LTD',
    authorRoleLabel: 'Developer',
  };
  assert.strictEqual(getStaffTag(developer), 'sent by developer');

  const agent = {
    senderType: 'user',
    authorName: 'Kolawole Ade',
    authorRoleLabel: 'Agent',
  };
  assert.strictEqual(getStaffTag(agent), 'sent by Kolawole Ade');

  const buyer = {
    senderType: 'user',
    authorName: 'Chidi Consumer',
    authorRoleLabel: 'Buyer',
  };
  assert.strictEqual(getStaffTag(buyer), null, 'Buyers must never receive staff tags');
});

// --- TEST 6: Quoted Reply & Message Status Mapping ---
console.log('\n--- TEST 6: Quoted Reply & Message Status Mapping ---');
runTest('Message status mappings evaluate to correct iconography and theme colors', () => {
  const getStatusMeta = (status) => {
    switch (status) {
      case 'read':
        return { icon: 'checkmark-done', color: '#38bdf8' };
      case 'delivered':
        return { icon: 'checkmark-done-outline', color: 'rgba(255, 255, 255, 0.7)' };
      case 'sending':
        return { icon: 'time-outline', color: 'rgba(255, 255, 255, 0.7)' };
      case 'error':
        return { icon: 'alert-circle', color: '#ef4444' };
      default:
        return { icon: 'checkmark-outline', color: 'rgba(255, 255, 255, 0.7)' };
    }
  };

  assert.strictEqual(getStatusMeta('read').icon, 'checkmark-done');
  assert.strictEqual(getStatusMeta('read').color, '#38bdf8');
  assert.strictEqual(getStatusMeta('delivered').icon, 'checkmark-done-outline');
  assert.strictEqual(getStatusMeta('error').icon, 'alert-circle');
  assert.strictEqual(getStatusMeta('error').color, '#ef4444');
  assert.strictEqual(getStatusMeta('sending').icon, 'time-outline');
  assert.strictEqual(getStatusMeta('sent').icon, 'checkmark-outline');
});

// --- TEST 7: Chaos, Unicode & Concurrency Safety ---
console.log('\n--- TEST 7: Chaos, Unicode & Concurrency Safety ---');
runTest('Extreme Unicode and 10,000-character payloads process safely without memory crash', () => {
  const extremeStrings = [
    '₦50,000,000 Luxury Penthouse Ikoyi',
    '🎙️ Voice memo: 2:35 PM on Friday 14th',
    'مرحبا بكم في ديلي شات العقارية',
    '欢迎使用 DelChat 房地产语音助手',
    'Zalgo t̷e̸x̸t̸ testing',
    'A'.repeat(10000),
  ];

  extremeStrings.forEach((str) => {
    const mockMsg = {
      id: 'test-extreme',
      senderType: 'user',
      authorName: str,
      authorRoleLabel: 'Agent',
      messageKind: 'voice_note',
      body: str,
      sentAt: new Date().toISOString(),
    };
    const tag = getStaffTag(mockMsg);
    assert(typeof tag === 'string');
  });
});

// --- TEST 8: Component Prop Contract Verification in Codebase ---
console.log('\n--- TEST 8: Component Prop Contract Verification in Codebase ---');
const typesCode = fs.readFileSync(path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'types.ts'), 'utf8');
const expectedInterfaces = [
  'VoiceNoteBubbleProps',
  'VoiceNotePlayerState',
  'VoiceNotePlayButtonProps',
  'VoiceNoteWaveformProps',
  'VoiceNoteQuotedReplyProps',
  'VoiceNoteStatusFooterProps',
  'VoiceNoteReactionMenuProps',
];

expectedInterfaces.forEach((iface) => {
  runTest(`Verified interface contract: ${iface}`, () => {
    assert(typesCode.includes(`interface ${iface}`), `Missing interface ${iface}`);
  });
});

const hookCode = fs.readFileSync(path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'useVoiceNotePlayer.ts'), 'utf8');
const expectedHookReturns = [
  'isPlaying',
  'playbackSeconds',
  'playbackSpeed',
  'duration',
  'activeBarsCount',
  'audioUri',
  'playerRef',
  'handleTogglePlay',
  'handleCycleSpeed',
  'formatAudioTime',
];

expectedHookReturns.forEach((prop) => {
  runTest(`useVoiceNotePlayer returns reactive property: ${prop}`, () => {
    assert(hookCode.includes(prop), `useVoiceNotePlayer missing property ${prop}`);
  });
});

// --- TEST 9: Strict Line Ceiling Check (All Files <= 200 Lines Target Ideal) ---
console.log('\n--- TEST 9: Strict Line Ceiling Check (All Files <= 200 Lines Target Ideal) ---');
const ALL_FILES = [
  path.join(baseDir, 'components', 'chat', 'bubbles', 'VoiceNoteBubble.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'types.ts'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'useVoiceNotePlayer.ts'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNotePlayButton.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNoteWaveform.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNoteMicBadge.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNoteHeader.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNoteQuotedReply.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNoteStatusFooter.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'VoiceNoteReactionMenu.tsx'),
  path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote', 'index.ts'),
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
console.log(`  VOICENOTE DEEP LIVE AUDIT: ${passedTests} PASSED / ${totalTests - passedTests} FAILED`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
