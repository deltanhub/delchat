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

console.log('\n--- Option 33: ChatListingBanner Modular Architecture Audit ---');

const files = [
  'components/chat/ChatListingBanner.tsx',
  'components/chat/listing_banner/index.ts',
  'components/chat/listing_banner/types.ts',
  'components/chat/listing_banner/utils.ts',
  'components/chat/listing_banner/styles.ts',
  'components/chat/listing_banner/ChatListingThumbnail.tsx',
  'components/chat/listing_banner/ChatListingInfoCol.tsx',
  'components/chat/listing_banner/ChatListingOpenButton.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/ChatListingBanner.tsx'), 'utf8');
assert(presenter.includes('export default function ChatListingBanner'), 'ChatListingBanner default export present');
assert(presenter.includes('ChatListingThumbnail'), 'Presenter renders ChatListingThumbnail');
assert(presenter.includes('ChatListingInfoCol'), 'Presenter renders ChatListingInfoCol');
assert(presenter.includes('ChatListingOpenButton'), 'Presenter renders ChatListingOpenButton');

console.log(`\nChatListingBanner Modular Architecture: ${passed} / ${total} tests passed.\n`);
