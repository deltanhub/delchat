const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

console.log('=== BROADCAST BUBBLE MODULAR ARCHITECTURE TEST ===');

const files = [
  'components/chat/bubbles/BroadcastBubble.tsx',
  'components/chat/bubbles/broadcast/styles.ts',
  'components/chat/bubbles/broadcast/types.ts',
  'components/chat/bubbles/broadcast/BroadcastHeader.tsx',
  'components/chat/bubbles/broadcast/BroadcastMediaView.tsx',
  'components/chat/bubbles/broadcast/index.ts',
];

for (const rel of files) {
  const full = path.join(ROOT, rel);
  assert(fs.existsSync(full), `File exists: ${rel}`);
  const lines = fs.readFileSync(full, 'utf8').split('\n').length;
  assert(lines <= 150, `${rel} meets <= 150 line limit (${lines} lines)`);
}

const main = fs.readFileSync(path.join(ROOT, files[0]), 'utf8');
assert(main.includes('export default function BroadcastBubble'), 'Exports BroadcastBubble default component');
assert(main.includes('BroadcastHeader'), 'Mounts BroadcastHeader');
assert(main.includes('BroadcastMediaView'), 'Mounts BroadcastMediaView');
assert(main.includes('Broadcast Announcement'), 'Renders announcement text');

console.log('ALL BROADCAST BUBBLE MODULAR TESTS PASSED (100%)');
