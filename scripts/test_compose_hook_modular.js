const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST BATCH 2.3: Compose Hook Modular Architecture Audit ---');
const baseDir = path.resolve(__dirname, '..');

const filesToCheck = [
  { file: 'hooks/useCompose.ts', max: 150 },
  { file: 'hooks/compose/types.ts', max: 150 },
  { file: 'hooks/compose/useContactSearch.ts', max: 150 },
  { file: 'hooks/compose/useGroupCreation.ts', max: 150 },
  { file: 'hooks/compose/index.ts', max: 150 },
];

for (const { file, max } of filesToCheck) {
  const filePath = path.join(baseDir, file);
  assert(fs.existsSync(filePath), `File must exist: ${file}`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
  assert(lines <= max, `${file} exceeds ${max} lines (${lines} lines)`);
  console.log(`  [PASS] ${file} is strictly modular: ${lines} <= ${max} lines`);
}

const barrelPath = path.join(baseDir, 'hooks/compose/index.ts');
const barrel = fs.readFileSync(barrelPath, 'utf8');
assert(barrel.includes("export * from './types'"), 'Barrel must export types');
assert(barrel.includes("export * from './useContactSearch'"), 'Barrel must export useContactSearch');
assert(barrel.includes("export * from './useGroupCreation'"), 'Barrel must export useGroupCreation');
console.log('  [PASS] hooks/compose/index.ts correctly exports all sub-modules');

const hookPath = path.join(baseDir, 'hooks/useCompose.ts');
const hook = fs.readFileSync(hookPath, 'utf8');
assert(hook.includes("useContactSearch"), 'useCompose must delegate to useContactSearch');
assert(hook.includes("useGroupCreation"), 'useCompose must delegate to useGroupCreation');
assert(hook.includes("handleModeChange"), 'useCompose must implement handleModeChange');
assert(hook.includes("handleToggleContact"), 'useCompose must implement handleToggleContact');
console.log('  [PASS] hooks/useCompose.ts delegates cleanly to modular sub-hooks');

console.log('--- ALL COMPOSE HOOK MODULAR ARCHITECTURE AUDITS PASSED ---');
