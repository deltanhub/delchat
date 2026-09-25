const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'hooks/call/useCallMedia.ts',
  'hooks/call/media/index.ts',
  'hooks/call/media/types.ts',
  'hooks/call/media/useMediaEngineInit.ts',
  'hooks/call/media/useMediaPeerActions.ts',
];

console.log('\n--- Call Media Domain Hook Modular Architecture Audit ---');
let passed = 0;

function check(cond, msg) {
  assert(cond, msg);
  console.log(`  [PASS] ${msg}`);
  passed++;
}

for (const f of files) {
  const full = path.join(ROOT, f);
  check(fs.existsSync(full), `${f} exists`);
  const lines = fs.readFileSync(full, 'utf8').split('\n').length;
  check(lines <= 150, `${f} strictly <= 150 LOC (${lines} lines)`);
}

const mainContent = fs.readFileSync(path.join(ROOT, 'hooks/call/useCallMedia.ts'), 'utf8');
check(mainContent.includes('export function useCallMedia'), 'useCallMedia export present');
check(mainContent.includes('useMediaEngineInit'), 'Delegates to useMediaEngineInit');
check(mainContent.includes('useMediaPeerActions'), 'Delegates to useMediaPeerActions');
check(mainContent.includes('connectionHealth'), 'Exposes connectionHealth');
check(mainContent.includes('initMedia'), 'Exposes initMedia');

console.log(`\nCall Media Modular Architecture: ${passed} / ${passed} tests passed.\n`);
