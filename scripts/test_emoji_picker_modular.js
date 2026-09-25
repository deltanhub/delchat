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

console.log('\n--- Option 32: EmojiPicker Modular Architecture Audit ---');

const files = [
  'components/chat/EmojiPicker.tsx',
  'components/chat/emoji_picker/index.ts',
  'components/chat/emoji_picker/types.ts',
  'components/chat/emoji_picker/utils.ts',
  'components/chat/emoji_picker/styles.ts',
  'components/chat/emoji_picker/useEmojiPicker.ts',
  'components/chat/emoji_picker/EmojiCategoryBar.tsx',
  'components/chat/emoji_picker/EmojiSearchBar.tsx',
  'components/chat/emoji_picker/EmojiGrid.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/EmojiPicker.tsx'), 'utf8');
assert(presenter.includes('export default function EmojiPicker'), 'EmojiPicker default export present');
assert(presenter.includes('export { getCountryCodeFromFlag }'), 'getCountryCodeFromFlag re-exported');
assert(presenter.includes('useEmojiPicker'), 'Presenter wires useEmojiPicker');
assert(presenter.includes('EmojiCategoryBar'), 'Presenter renders EmojiCategoryBar');
assert(presenter.includes('EmojiSearchBar'), 'Presenter renders EmojiSearchBar');
assert(presenter.includes('EmojiGrid'), 'Presenter renders EmojiGrid');

console.log(`\nEmojiPicker Modular Architecture: ${passed} / ${total} tests passed.\n`);
