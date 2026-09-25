const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT CHAT COMPOSER MODULAR ARCHITECTURE AUDIT');
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
const composerFile = path.join(baseDir, 'components', 'chat', 'ChatComposer.tsx');
const composerDir = path.join(baseDir, 'components', 'chat', 'composer');

const EXPECTED_FILES = [
  'types.ts',
  'constants.ts',
  'useAudioRecording.ts',
  'useComposerKeyboard.ts',
  'ComposerAttachmentMenu.tsx',
  'ComposerReplyBanner.tsx',
  'ComposerRecordingBar.tsx',
  'ComposerInputBar.tsx',
  'ComposerDisabledBanner.tsx',
  'index.ts',
];

console.log('--- 1. File Structure & Component Inventory ---');
runTest('ChatComposer.tsx exists', () => {
  assert(fs.existsSync(composerFile), 'ChatComposer.tsx must exist');
});

EXPECTED_FILES.forEach((f) => {
  runTest(`Sub-module composer/${f} exists`, () => {
    assert(fs.existsSync(path.join(composerDir, f)), `File ${f} must exist in composer/`);
  });
});

console.log('\n--- 2. Hard Line Count Constraints (Target Ideal <= 200, Hard Ceiling < 250) ---');
runTest('ChatComposer.tsx is strictly <= 200 lines (Target Ideal)', () => {
  const lines = fs.readFileSync(composerFile, 'utf8').split('\n').length;
  assert(lines <= 200, `ChatComposer.tsx is ${lines} lines, expected <= 200`);
});

EXPECTED_FILES.forEach((f) => {
  runTest(`composer/${f} is strictly <= 200 lines`, () => {
    const lines = fs.readFileSync(path.join(composerDir, f), 'utf8').split('\n').length;
    assert(lines <= 200, `${f} is ${lines} lines, expected <= 200`);
  });
});

console.log('\n--- 3. Architectural Decoupling & Hook Isolation ---');
runTest('useAudioRecording encapsulates expo-audio and safe unmount cleanup', () => {
  const hookContent = fs.readFileSync(path.join(composerDir, 'useAudioRecording.ts'), 'utf8');
  assert(hookContent.includes('useAudioRecorder'), 'Must consume useAudioRecorder');
  assert(hookContent.includes('handleStartRecording'), 'Must export handleStartRecording');
  assert(hookContent.includes('handleStopRecording'), 'Must export handleStopRecording');
  assert(hookContent.includes('formatRecordTime'), 'Must export formatRecordTime');
  assert(hookContent.includes('RecordingPresets.HIGH_QUALITY'), 'Must use HIGH_QUALITY preset');
});

runTest('ChatComposer delegates keyboard padding to useComposerKeyboard', () => {
  const presenter = fs.readFileSync(composerFile, 'utf8');
  assert(presenter.includes('useComposerKeyboard'), 'Must consume useComposerKeyboard');
  assert(presenter.includes('useAudioRecording'), 'Must consume useAudioRecording');
});

console.log('\n--- 4. Component Interface & Contract Verification ---');
runTest('types.ts defines explicit prop contracts', () => {
  const typesContent = fs.readFileSync(path.join(composerDir, 'types.ts'), 'utf8');
  assert(typesContent.includes('type ChatAttachmentActionType'), 'Must declare ChatAttachmentActionType');
  assert(typesContent.includes('interface ChatComposerProps'), 'Must declare ChatComposerProps');
  assert(typesContent.includes('interface AudioRecordingState'), 'Must declare AudioRecordingState');
  assert(typesContent.includes('interface ComposerAttachmentMenuProps'), 'Must declare ComposerAttachmentMenuProps');
  assert(typesContent.includes('interface ComposerReplyBannerProps'), 'Must declare ComposerReplyBannerProps');
  assert(typesContent.includes('interface ComposerRecordingBarProps'), 'Must declare ComposerRecordingBarProps');
  assert(typesContent.includes('interface ComposerInputBarProps'), 'Must declare ComposerInputBarProps');
  assert(typesContent.includes('interface ComposerDisabledBannerProps'), 'Must declare ComposerDisabledBannerProps');
});

runTest('composer/index.ts exports all sub-components and hooks', () => {
  const barrelContent = fs.readFileSync(path.join(composerDir, 'index.ts'), 'utf8');
  assert(barrelContent.includes("export * from './types'"));
  assert(barrelContent.includes("export * from './constants'"));
  assert(barrelContent.includes("export * from './useAudioRecording'"));
  assert(barrelContent.includes("export * from './useComposerKeyboard'"));
  assert(barrelContent.includes("export * from './ComposerAttachmentMenu'"));
  assert(barrelContent.includes("export * from './ComposerReplyBanner'"));
  assert(barrelContent.includes("export * from './ComposerRecordingBar'"));
  assert(barrelContent.includes("export * from './ComposerInputBar'"));
  assert(barrelContent.includes("export * from './ComposerDisabledBanner'"));
});

console.log('\n================================================================');
console.log(`  CHAT COMPOSER MODULAR AUDIT: ${passedTests} PASSED / ${totalTests - passedTests} FAILED`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
