/**
 * test_batch9_call_stages_modular_architecture.js
 * Verification of Batch 9: Call Modal, Audio/Video Stages, and PiP Window.
 * Strictly verifies that EVERY file is <= 150 lines and calling contracts are intact.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  BATCH 9 CALL STAGES & MODAL MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification for all Batch 9 files
test('Every Batch 9 Call Modal and Stage file is strictly <= 150 lines of code', () => {
  const files = [
    'components/chat/CallModal.tsx',
    'components/chat/call/CallAudioStage.tsx',
    'components/chat/call/audioStageStyles.ts',
    'components/chat/call/CallPipWindow.tsx',
    'components/chat/call/pipStyles.ts',
    'components/chat/call/usePipDrag.ts',
    'components/chat/call/CallVideoStage.tsx',
    'components/chat/call/videoStageStyles.ts',
    'components/chat/call/CallControlsDock.tsx',
    'components/chat/call/CallHeader.tsx',
    'components/chat/call/CallReconnectingBanner.tsx',
    'components/chat/call/callModalStyles.ts',
    'components/chat/call/index.ts',
    'components/chat/call/types.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 150, `${f} has ${lines} lines, exceeding strict 150 limit!`);
  }
});

// 2. CallModal slim presenter contracts
test('CallModal coordinates stages, banners, proximity, and badges', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/CallModal.tsx'), 'utf8');
  assert(content.includes('proximityService'));
  assert(content.includes('isNearProximity'));
  assert(content.includes('partnerMuteBadge'));
  assert(content.includes('cameraPausedBadge'));
  assert(content.includes('CallReconnectingBanner'));
  assert(content.includes('<CallVideoStage'));
  assert(content.includes('<CallAudioStage'));
  assert(content.includes('<CallPipWindow'));
  assert(content.includes('<CallControlsDock'));
});

// 3. Audio & Video Stage contracts
test('Audio and Video stages preserve soundwave pulses, remote canvas and badges', () => {
  const audio = fs.readFileSync(path.join(ROOT, 'components/chat/call/CallAudioStage.tsx'), 'utf8');
  assert(audio.includes('animatedAudioPulseStyle'));
  assert(audio.includes('<CallHeader'));

  const video = fs.readFileSync(path.join(ROOT, 'components/chat/call/CallVideoStage.tsx'), 'utf8');
  assert(video.includes('remoteVideoCanvas'));
  assert(video.includes('cameraPausedBadge'));
  assert(video.includes('videoQualityBadge'));
});

// 4. PiP Window contracts
test('CallPipWindow preserves pan gesture tracking, camera flip, and permissions', () => {
  const pip = fs.readFileSync(path.join(ROOT, 'components/chat/call/CallPipWindow.tsx'), 'utf8');
  assert(pip.includes('usePipDrag'));
  assert(pip.includes('useCameraPermissions'));
  assert(pip.includes('CameraView'));
});

console.log(`\nAll ${passed} Batch 9 modular architecture tests passed successfully.\n`);
