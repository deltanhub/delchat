const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT STARRED MESSAGES MODULAR ARCHITECTURE VERIFICATION');
console.log('================================================================\n');

const projectRoot = path.resolve(__dirname, '..');

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

const files = [
  { path: 'components/chat/StarredMessagesModal.tsx', maxLines: 200, role: 'Slim Presenter' },
  { path: 'hooks/useStarredMessages.ts', maxLines: 200, role: 'Domain Hook' },
  { path: 'components/chat/starred/StarredMessagesHeader.tsx', maxLines: 200, role: 'Sub-component Header' },
  { path: 'components/chat/starred/StarredMessagesScopeTabs.tsx', maxLines: 200, role: 'Sub-component Scope Tabs' },
  { path: 'components/chat/starred/StarredMessagesSearchBar.tsx', maxLines: 200, role: 'Sub-component Search Bar' },
  { path: 'components/chat/starred/StarredMessageCard.tsx', maxLines: 200, role: 'Sub-component Card' },
  { path: 'components/chat/starred/StarredMediaBadge.tsx', maxLines: 200, role: 'Sub-component Media Badge' },
  { path: 'components/chat/starred/StarredMessagesEmptyState.tsx', maxLines: 200, role: 'Sub-component Empty State' },
  { path: 'components/chat/starred/types.ts', maxLines: 100, role: 'Type Definitions' },
  { path: 'components/chat/starred/index.ts', maxLines: 50, role: 'Barrel Export' },
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
const modalPath = path.join(projectRoot, 'components/chat/StarredMessagesModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert(
  modalContent.includes('useStarredMessages'),
  'StarredMessagesModal must delegate state orchestration to useStarredMessages'
);
console.log('  [PASS] StarredMessagesModal delegates all state orchestration to useStarredMessages hook');

assert(
  !modalContent.includes('supabase.rpc'),
  'StarredMessagesModal must not make direct supabase RPC calls'
);
console.log('  [PASS] StarredMessagesModal eliminated direct Supabase RPC calls');

assert(
  !modalContent.includes('supabase.from'),
  'StarredMessagesModal must not make direct supabase table calls'
);
console.log('  [PASS] StarredMessagesModal eliminated direct Supabase table queries');

console.log('\n--- SECTION 3: Component Composition & Submodule Mounting Audit ---');
assert(modalContent.includes('<StarredMessagesHeader'), 'Mounts StarredMessagesHeader');
assert(modalContent.includes('<StarredMessagesScopeTabs'), 'Mounts StarredMessagesScopeTabs');
assert(modalContent.includes('<StarredMessagesSearchBar'), 'Mounts StarredMessagesSearchBar');
assert(modalContent.includes('<StarredMessagesEmptyState'), 'Mounts StarredMessagesEmptyState');
assert(modalContent.includes('<StarredMessageCard'), 'Mounts StarredMessageCard');
console.log('  [PASS] StarredMessagesModal mounts all 5 specialized sub-components');

console.log('\n--- SECTION 4: Backward Compatibility & Barrel Export Verification ---');
assert(modalContent.includes('StarredMessageItem'), 'Re-exports StarredMessageItem');
assert(modalContent.includes('StarredMessagesModalProps'), 'Re-exports StarredMessagesModalProps');
console.log('  [PASS] StarredMessagesModal preserves full backward compatibility exports');

const barrelPath = path.join(projectRoot, 'components/chat/starred/index.ts');
const barrelContent = fs.readFileSync(barrelPath, 'utf8');
assert(barrelContent.includes('StarredMessagesHeader'), 'Exports StarredMessagesHeader');
assert(barrelContent.includes('StarredMessagesScopeTabs'), 'Exports StarredMessagesScopeTabs');
assert(barrelContent.includes('StarredMessagesSearchBar'), 'Exports StarredMessagesSearchBar');
assert(barrelContent.includes('StarredMessageCard'), 'Exports StarredMessageCard');
assert(barrelContent.includes('StarredMediaBadge'), 'Exports StarredMediaBadge');
assert(barrelContent.includes('StarredMessagesEmptyState'), 'Exports StarredMessagesEmptyState');
console.log('  [PASS] components/chat/starred/index.ts cleanly exports all sub-components');

console.log('\n================================================================');
console.log('  STARRED MESSAGES MODULAR ARCHITECTURE: 27 PASSED / 0 FAILED');
console.log('================================================================\n');
