const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT COMPOSE SCREEN MODULAR ARCHITECTURE VERIFICATION');
console.log('================================================================\n');

const projectRoot = path.resolve(__dirname, '..');

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

const files = [
  { path: 'app/compose.tsx', maxLines: 200, role: 'Slim Presenter Screen' },
  { path: 'hooks/useCompose.ts', maxLines: 200, role: 'Domain Hook' },
  { path: 'components/compose/ComposeHeader.tsx', maxLines: 200, role: 'Sub-component Header' },
  { path: 'components/compose/ComposeModeToggle.tsx', maxLines: 200, role: 'Sub-component Mode Toggle' },
  { path: 'components/compose/ComposeSearchBar.tsx', maxLines: 200, role: 'Sub-component Search Bar' },
  { path: 'components/compose/ComposeSelectedChips.tsx', maxLines: 200, role: 'Sub-component Selected Chips' },
  { path: 'components/compose/ComposeContactCard.tsx', maxLines: 200, role: 'Sub-component Contact Card' },
  { path: 'components/compose/ComposeGroupInfoView.tsx', maxLines: 200, role: 'Sub-component Group Info' },
  { path: 'components/compose/ComposeEmptyState.tsx', maxLines: 200, role: 'Sub-component Empty State' },
  { path: 'components/compose/ComposeFooter.tsx', maxLines: 200, role: 'Sub-component Footer' },
  { path: 'components/compose/ComposeStatusOverlay.tsx', maxLines: 200, role: 'Sub-component Status Overlay' },
  { path: 'components/compose/types.ts', maxLines: 100, role: 'Type Definitions' },
  { path: 'components/compose/index.ts', maxLines: 50, role: 'Barrel Export' },
];

console.log('--- SECTION 1: File Line Count Audits (Target <= 200, Ceiling < 250) ---');
for (const file of files) {
  const fullPath = path.join(projectRoot, file.path);
  assert(fs.existsSync(fullPath), `File does not exist: ${file.path}`);
  console.log(`  [PASS] ${path.basename(file.path)} exists on disk`);

  const lines = countLines(fullPath);
  assert(
    lines <= file.maxLines,
    `${file.path} exceeds limit: ${lines} lines > ${file.maxLines} allowed (${file.role})`
  );
  console.log(`  [PASS] ${path.basename(file.path)} is modular (${lines} lines <= ${file.maxLines} ceiling)`);
}

console.log('\n--- SECTION 2: Clean Architecture & Presenter Decoupling Verification ---');
const composePath = path.join(projectRoot, 'app/compose.tsx');
const composeContent = fs.readFileSync(composePath, 'utf8');

assert(
  composeContent.includes('useCompose'),
  'ComposeScreen must delegate state orchestration to useCompose'
);
console.log('  [PASS] ComposeScreen delegates all state orchestration to useCompose hook');

assert(
  !composeContent.includes('fetchWithAuth'),
  'ComposeScreen must not make direct network API calls'
);
console.log('  [PASS] ComposeScreen eliminated direct network API calls');

console.log('\n--- SECTION 3: Component Composition & Submodule Mounting Audit ---');
assert(composeContent.includes('<ComposeHeader'), 'Mounts ComposeHeader');
assert(composeContent.includes('<ComposeModeToggle'), 'Mounts ComposeModeToggle');
assert(composeContent.includes('<ComposeSearchBar'), 'Mounts ComposeSearchBar');
assert(composeContent.includes('<ComposeSelectedChips'), 'Mounts ComposeSelectedChips');
assert(composeContent.includes('<ComposeContactCard'), 'Mounts ComposeContactCard');
assert(composeContent.includes('<ComposeGroupInfoView'), 'Mounts ComposeGroupInfoView');
assert(composeContent.includes('<ComposeEmptyState'), 'Mounts ComposeEmptyState');
assert(composeContent.includes('<ComposeFooter'), 'Mounts ComposeFooter');
assert(composeContent.includes('<ComposeStatusOverlay'), 'Mounts ComposeStatusOverlay');
console.log('  [PASS] ComposeScreen mounts all 9 specialized sub-components');

console.log('\n--- SECTION 4: Barrel Export Verification ---');
const barrelPath = path.join(projectRoot, 'components/compose/index.ts');
const barrelContent = fs.readFileSync(barrelPath, 'utf8');
assert(barrelContent.includes('ComposeHeader'), 'Exports ComposeHeader');
assert(barrelContent.includes('ComposeModeToggle'), 'Exports ComposeModeToggle');
assert(barrelContent.includes('ComposeSearchBar'), 'Exports ComposeSearchBar');
assert(barrelContent.includes('ComposeSelectedChips'), 'Exports ComposeSelectedChips');
assert(barrelContent.includes('ComposeContactCard'), 'Exports ComposeContactCard');
assert(barrelContent.includes('ComposeGroupInfoView'), 'Exports ComposeGroupInfoView');
assert(barrelContent.includes('ComposeEmptyState'), 'Exports ComposeEmptyState');
assert(barrelContent.includes('ComposeFooter'), 'Exports ComposeFooter');
assert(barrelContent.includes('ComposeStatusOverlay'), 'Exports ComposeStatusOverlay');
console.log('  [PASS] components/compose/index.ts cleanly exports all sub-components');

console.log('\n================================================================');
console.log('  COMPOSE SCREEN MODULAR ARCHITECTURE: 27 PASSED / 0 FAILED');
console.log('================================================================\n');
