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

console.log('\n--- Option 35: MediaViewerModal Modular Architecture Audit ---');

const files = [
  'components/chat/MediaViewerModal.tsx',
  'components/chat/media_viewer/index.ts',
  'components/chat/media_viewer/types.ts',
  'components/chat/media_viewer/utils.ts',
  'components/chat/media_viewer/styles.ts',
  'components/chat/media_viewer/MediaViewerTopBar.tsx',
  'components/chat/media_viewer/MediaViewerStage.tsx',
  'components/chat/media_viewer/MediaViewerBottomBar.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/MediaViewerModal.tsx'), 'utf8');
assert(presenter.includes('export const MediaViewerModal'), 'MediaViewerModal named export present');
assert(presenter.includes('export default MediaViewerModal'), 'MediaViewerModal default export present');
assert(presenter.includes('MediaViewerTopBar'), 'Presenter renders MediaViewerTopBar');
assert(presenter.includes('MediaViewerStage'), 'Presenter renders MediaViewerStage');
assert(presenter.includes('MediaViewerBottomBar'), 'Presenter renders MediaViewerBottomBar');

console.log(`\nMediaViewerModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
