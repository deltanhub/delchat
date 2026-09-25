const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT VOICENOTE BUBBLE MODULAR ARCHITECTURE AUDIT');
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
const bubbleFile = path.join(baseDir, 'components', 'chat', 'bubbles', 'VoiceNoteBubble.tsx');
const vnDir = path.join(baseDir, 'components', 'chat', 'bubbles', 'voicenote');

const EXPECTED_FILES = [
  'types.ts',
  'useVoiceNotePlayer.ts',
  'VoiceNotePlayButton.tsx',
  'VoiceNoteWaveform.tsx',
  'VoiceNoteMicBadge.tsx',
  'VoiceNoteHeader.tsx',
  'VoiceNoteQuotedReply.tsx',
  'VoiceNoteStatusFooter.tsx',
  'VoiceNoteReactionMenu.tsx',
  'index.ts',
];

console.log('--- 1. File Structure & Component Inventory ---');
runTest('VoiceNoteBubble.tsx exists', () => {
  assert(fs.existsSync(bubbleFile), 'VoiceNoteBubble.tsx must exist');
});

EXPECTED_FILES.forEach((f) => {
  runTest(`Sub-module voicenote/${f} exists`, () => {
    assert(fs.existsSync(path.join(vnDir, f)), `File ${f} must exist in voicenote/`);
  });
});

console.log('\n--- 2. Hard Line Count Constraints (Target Ideal <= 200, Hard Ceiling < 250) ---');
runTest('VoiceNoteBubble.tsx is strictly <= 200 lines (Target Ideal)', () => {
  const lines = fs.readFileSync(bubbleFile, 'utf8').split('\n').length;
  assert(lines <= 200, `VoiceNoteBubble.tsx is ${lines} lines, expected <= 200`);
});

EXPECTED_FILES.forEach((f) => {
  runTest(`voicenote/${f} is strictly <= 200 lines`, () => {
    const lines = fs.readFileSync(path.join(vnDir, f), 'utf8').split('\n').length;
    assert(lines <= 200, `${f} is ${lines} lines, expected <= 200`);
  });
});

console.log('\n--- 3. Architectural Decoupling & Hook Isolation ---');
runTest('useVoiceNotePlayer encapsulates expo-audio and auto-pause synchronization', () => {
  const hookContent = fs.readFileSync(path.join(vnDir, 'useVoiceNotePlayer.ts'), 'utf8');
  assert(hookContent.includes('subscribeAudioPlayback'), 'Must subscribe to audio playback events');
  assert(hookContent.includes('registerAudioPlayback'), 'Must register with single-stream coordinator');
  assert(hookContent.includes('createAudioPlayer'), 'Must use expo-audio createAudioPlayer');
  assert(hookContent.includes('handleTogglePlay'), 'Must export handleTogglePlay');
  assert(hookContent.includes('handleCycleSpeed'), 'Must export handleCycleSpeed');
});

runTest('VoiceNoteBubble coordinates single-stream playback synchronization', () => {
  const presenter = fs.readFileSync(bubbleFile, 'utf8');
  assert(presenter.includes('registerAudioPlayback'), 'Must coordinate registerAudioPlayback');
  assert(presenter.includes('createAudioPlayer') || presenter.includes('expo-audio'), 'Must reference expo-audio');
  assert(presenter.includes('useVoiceNotePlayer'), 'Must consume useVoiceNotePlayer');
});

console.log('\n--- 4. Component Interface & Contract Verification ---');
runTest('types.ts defines explicit prop contracts', () => {
  const typesContent = fs.readFileSync(path.join(vnDir, 'types.ts'), 'utf8');
  assert(typesContent.includes('interface VoiceNoteBubbleProps'), 'Must declare VoiceNoteBubbleProps');
  assert(typesContent.includes('interface VoiceNotePlayerState'), 'Must declare VoiceNotePlayerState');
  assert(typesContent.includes('interface VoiceNotePlayButtonProps'), 'Must declare VoiceNotePlayButtonProps');
  assert(typesContent.includes('interface VoiceNoteWaveformProps'), 'Must declare VoiceNoteWaveformProps');
  assert(typesContent.includes('interface VoiceNoteQuotedReplyProps'), 'Must declare VoiceNoteQuotedReplyProps');
  assert(typesContent.includes('interface VoiceNoteStatusFooterProps'), 'Must declare VoiceNoteStatusFooterProps');
  assert(typesContent.includes('interface VoiceNoteReactionMenuProps'), 'Must declare VoiceNoteReactionMenuProps');
});

runTest('voicenote/index.ts exports all sub-components and hooks', () => {
  const barrelContent = fs.readFileSync(path.join(vnDir, 'index.ts'), 'utf8');
  assert(barrelContent.includes("export * from './types'"));
  assert(barrelContent.includes("export * from './useVoiceNotePlayer'"));
  assert(barrelContent.includes("export * from './VoiceNotePlayButton'"));
  assert(barrelContent.includes("export * from './VoiceNoteWaveform'"));
  assert(barrelContent.includes("export * from './VoiceNoteMicBadge'"));
  assert(barrelContent.includes("export * from './VoiceNoteHeader'"));
  assert(barrelContent.includes("export * from './VoiceNoteQuotedReply'"));
  assert(barrelContent.includes("export * from './VoiceNoteStatusFooter'"));
  assert(barrelContent.includes("export * from './VoiceNoteReactionMenu'"));
});

console.log('\n================================================================');
console.log(`  VOICENOTE MODULAR AUDIT: ${passedTests} PASSED / ${totalTests - passedTests} FAILED`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
