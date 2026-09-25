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

console.log('\n--- Option 27: EmbedUrlModal Modular Architecture Audit ---');

const files = [
  'components/chat/EmbedUrlModal.tsx',
  'components/chat/embed/index.ts',
  'components/chat/embed/types.ts',
  'components/chat/embed/constants.ts',
  'components/chat/embed/styles.ts',
  'components/chat/embed/useEmbedUrlForm.ts',
  'components/chat/embed/EmbedHeader.tsx',
  'components/chat/embed/EmbedUrlInput.tsx',
  'components/chat/embed/EmbedTitleInput.tsx',
  'components/chat/embed/EmbedActionButtons.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/EmbedUrlModal.tsx'), 'utf8');
assert(presenter.includes('export default function EmbedUrlModal'), 'EmbedUrlModal default export present');
assert(presenter.includes('export { EmbedUrlModalProps }'), 'EmbedUrlModalProps re-exported');
assert(presenter.includes('useEmbedUrlForm'), 'Presenter wires useEmbedUrlForm');
assert(presenter.includes('EmbedHeader'), 'Presenter renders EmbedHeader');
assert(presenter.includes('EmbedUrlInput'), 'Presenter renders EmbedUrlInput');
assert(presenter.includes('EmbedTitleInput'), 'Presenter renders EmbedTitleInput');
assert(presenter.includes('EmbedActionButtons'), 'Presenter renders EmbedActionButtons');

console.log(`\nEmbedUrlModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
