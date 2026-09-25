const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'hooks/inbox/useInboxActions.ts',
  'hooks/inbox/actions/index.ts',
  'hooks/inbox/actions/types.ts',
  'hooks/inbox/actions/useConversationMutationActions.ts',
  'hooks/inbox/actions/useConversationSafetyActions.ts',
];

console.log('\n--- Inbox Actions Domain Hook Modular Architecture Audit ---');
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

const mainContent = fs.readFileSync(path.join(ROOT, 'hooks/inbox/useInboxActions.ts'), 'utf8');
check(mainContent.includes('export function useInboxActions'), 'useInboxActions export present');
check(mainContent.includes('useConversationMutationActions'), 'Delegates to useConversationMutationActions');
check(mainContent.includes('useConversationSafetyActions'), 'Delegates to useConversationSafetyActions');

console.log(`\nInbox Actions Modular Architecture: ${passed} / ${passed} tests passed.\n`);
