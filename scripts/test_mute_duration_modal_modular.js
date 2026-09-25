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

console.log('\n--- Option 34: MuteDurationModal Modular Architecture Audit ---');

const files = [
  'components/chat/MuteDurationModal.tsx',
  'components/chat/mute_duration/index.ts',
  'components/chat/mute_duration/types.ts',
  'components/chat/mute_duration/constants.ts',
  'components/chat/mute_duration/styles.ts',
  'components/chat/mute_duration/MuteDurationHeader.tsx',
  'components/chat/mute_duration/MuteDurationOptionsList.tsx',
  'components/chat/mute_duration/MuteDurationCancelButton.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/MuteDurationModal.tsx'), 'utf8');
assert(presenter.includes('export default function MuteDurationModal'), 'MuteDurationModal default export present');
assert(presenter.includes('MuteDurationHeader'), 'Presenter renders MuteDurationHeader');
assert(presenter.includes('MuteDurationOptionsList'), 'Presenter renders MuteDurationOptionsList');
assert(presenter.includes('MuteDurationCancelButton'), 'Presenter renders MuteDurationCancelButton');

console.log(`\nMuteDurationModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
