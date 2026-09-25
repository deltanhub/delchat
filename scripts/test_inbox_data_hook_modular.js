const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST BATCH 2.5: Inbox Data Hook Modular Architecture Audit ---');
const baseDir = path.resolve(__dirname, '..');

const filesToCheck = [
  { file: 'hooks/inbox/useInboxData.ts', max: 150 },
  { file: 'hooks/inbox/data/types.ts', max: 150 },
  { file: 'hooks/inbox/data/sortConversations.ts', max: 150 },
  { file: 'hooks/inbox/data/useInboxAuthProfile.ts', max: 150 },
  { file: 'hooks/inbox/data/useInboxRealtimeSubscription.ts', max: 150 },
  { file: 'hooks/inbox/data/index.ts', max: 150 },
];

for (const { file, max } of filesToCheck) {
  const filePath = path.join(baseDir, file);
  assert(fs.existsSync(filePath), `File must exist: ${file}`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
  assert(lines <= max, `${file} exceeds ${max} lines (${lines} lines)`);
  console.log(`  [PASS] ${file} is strictly modular: ${lines} <= ${max} lines`);
}

const barrelPath = path.join(baseDir, 'hooks/inbox/data/index.ts');
const barrel = fs.readFileSync(barrelPath, 'utf8');
assert(barrel.includes("export * from './types'"), 'Barrel must export types');
assert(barrel.includes("export * from './sortConversations'"), 'Barrel must export sortConversations');
assert(barrel.includes("export * from './useInboxAuthProfile'"), 'Barrel must export useInboxAuthProfile');
assert(barrel.includes("export * from './useInboxRealtimeSubscription'"), 'Barrel must export useInboxRealtimeSubscription');
console.log('  [PASS] hooks/inbox/data/index.ts correctly exports all sub-modules');

const hookPath = path.join(baseDir, 'hooks/inbox/useInboxData.ts');
const hook = fs.readFileSync(hookPath, 'utf8');
assert(hook.includes("useInboxAuthProfile"), 'useInboxData must delegate to useInboxAuthProfile');
assert(hook.includes("useInboxRealtimeSubscription"), 'useInboxData must delegate to useInboxRealtimeSubscription');
assert(hook.includes("sortConversations"), 'useInboxData must import sortConversations');
console.log('  [PASS] hooks/inbox/useInboxData.ts delegates cleanly to modular sub-hooks');

console.log('--- ALL INBOX DATA HOOK MODULAR ARCHITECTURE AUDITS PASSED ---');
