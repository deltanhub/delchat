const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST BATCH 2.6: Starred Messages Hook Modular Architecture Audit ---');
const baseDir = path.resolve(__dirname, '..');

const filesToCheck = [
  { file: 'hooks/useStarredMessages.ts', max: 150 },
  { file: 'hooks/starred/types.ts', max: 150 },
  { file: 'hooks/starred/starredMappers.ts', max: 150 },
  { file: 'hooks/starred/useStarredFetch.ts', max: 150 },
  { file: 'hooks/starred/useStarredUnstar.ts', max: 150 },
  { file: 'hooks/starred/index.ts', max: 150 },
];

for (const { file, max } of filesToCheck) {
  const filePath = path.join(baseDir, file);
  assert(fs.existsSync(filePath), `File must exist: ${file}`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
  assert(lines <= max, `${file} exceeds ${max} lines (${lines} lines)`);
  console.log(`  [PASS] ${file} is strictly modular: ${lines} <= ${max} lines`);
}

const barrelPath = path.join(baseDir, 'hooks/starred/index.ts');
const barrel = fs.readFileSync(barrelPath, 'utf8');
assert(barrel.includes("export * from './types'"), 'Barrel must export types');
assert(barrel.includes("export * from './starredMappers'"), 'Barrel must export starredMappers');
assert(barrel.includes("export * from './useStarredFetch'"), 'Barrel must export useStarredFetch');
assert(barrel.includes("export * from './useStarredUnstar'"), 'Barrel must export useStarredUnstar');
console.log('  [PASS] hooks/starred/index.ts correctly exports all sub-modules');

const hookPath = path.join(baseDir, 'hooks/useStarredMessages.ts');
const hook = fs.readFileSync(hookPath, 'utf8');
assert(hook.includes("useStarredFetch"), 'useStarredMessages must delegate to useStarredFetch');
assert(hook.includes("useStarredUnstar"), 'useStarredMessages must delegate to useStarredUnstar');
console.log('  [PASS] hooks/useStarredMessages.ts delegates cleanly to modular sub-hooks');

console.log('--- ALL STARRED MESSAGES HOOK MODULAR ARCHITECTURE AUDITS PASSED ---');
