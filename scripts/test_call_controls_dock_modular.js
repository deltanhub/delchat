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

console.log('\n--- Option 26: CallControlsDock Modular Architecture Audit ---');

const files = [
  'components/chat/call/CallControlsDock.tsx',
  'components/chat/call/controls/index.ts',
  'components/chat/call/controls/types.ts',
  'components/chat/call/controls/styles.ts',
  'components/chat/call/controls/VideoControlsPill.tsx',
  'components/chat/call/controls/IncomingCallActions.tsx',
  'components/chat/call/controls/InCallAudioControls.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/call/CallControlsDock.tsx'), 'utf8');
assert(presenter.includes('export const CallControlsDock'), 'CallControlsDock named export present');
assert(presenter.includes('export { CallControlsDockProps }'), 'CallControlsDockProps interface re-exported');
assert(presenter.includes('VideoControlsPill'), 'Presenter uses VideoControlsPill');
assert(presenter.includes('IncomingCallActions'), 'Presenter uses IncomingCallActions');
assert(presenter.includes('InCallAudioControls'), 'Presenter uses InCallAudioControls');

console.log(`\nCallControlsDock Modular Architecture: ${passed} / ${total} tests passed.\n`);
