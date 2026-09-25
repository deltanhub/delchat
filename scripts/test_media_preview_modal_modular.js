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

console.log('\n--- Option 29: MediaPreviewModal Modular Architecture Audit ---');

const files = [
  'components/chat/MediaPreviewModal.tsx',
  'components/chat/media_preview/index.ts',
  'components/chat/media_preview/types.ts',
  'components/chat/media_preview/styles.ts',
  'components/chat/media_preview/useMediaPreviewStage.ts',
  'components/chat/media_preview/MediaPreviewTopBar.tsx',
  'components/chat/media_preview/MediaPreviewMainView.tsx',
  'components/chat/media_preview/MediaPreviewThumbnailStrip.tsx',
  'components/chat/media_preview/MediaPreviewCaptionBar.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/MediaPreviewModal.tsx'), 'utf8');
assert(presenter.includes('export const MediaPreviewModal'), 'MediaPreviewModal named export present');
assert(presenter.includes('export default MediaPreviewModal'), 'MediaPreviewModal default export present');
assert(presenter.includes('export { MediaPreviewModalProps }'), 'MediaPreviewModalProps re-exported');
assert(presenter.includes('useMediaPreviewStage'), 'Presenter wires useMediaPreviewStage');
assert(presenter.includes('MediaPreviewTopBar'), 'Presenter renders MediaPreviewTopBar');
assert(presenter.includes('MediaPreviewMainView'), 'Presenter renders MediaPreviewMainView');
assert(presenter.includes('MediaPreviewThumbnailStrip'), 'Presenter renders MediaPreviewThumbnailStrip');
assert(presenter.includes('MediaPreviewCaptionBar'), 'Presenter renders MediaPreviewCaptionBar');

console.log(`\nMediaPreviewModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
