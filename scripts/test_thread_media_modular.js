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

console.log('\n--- Thread Media Domain Hook Modular Architecture Audit ---');

const files = [
  'hooks/thread/useThreadMedia.ts',
  'hooks/thread/media/index.ts',
  'hooks/thread/media/types.ts',
  'hooks/thread/media/useMediaViewerState.ts',
  'hooks/thread/media/useStagedMediaState.ts',
  'hooks/thread/media/useMediaPickerActions.ts',
  'hooks/thread/media/useDocumentPickerActions.ts',
  'hooks/thread/media/useStagedMediaSend.ts',
  'hooks/thread/media/useVoiceNoteSend.ts',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const orchestrator = fs.readFileSync(path.join(ROOT, 'hooks/thread/useThreadMedia.ts'), 'utf8');
assert(orchestrator.includes('export function useThreadMedia'), 'useThreadMedia export present');
assert(orchestrator.includes('useMediaViewerState'), 'Delegates to useMediaViewerState');
assert(orchestrator.includes('useStagedMediaState'), 'Delegates to useStagedMediaState');
assert(orchestrator.includes('useMediaPickerActions'), 'Delegates to useMediaPickerActions');
assert(orchestrator.includes('useDocumentPickerActions'), 'Delegates to useDocumentPickerActions');
assert(orchestrator.includes('useStagedMediaSend'), 'Delegates to useStagedMediaSend');
assert(orchestrator.includes('useVoiceNoteSend'), 'Delegates to useVoiceNoteSend');

console.log(`\nThread Media Modular Architecture: ${passed} / ${total} tests passed.\n`);
