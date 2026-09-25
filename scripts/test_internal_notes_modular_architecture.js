/**
 * test_internal_notes_modular_architecture.js
 * Verification of LeadInternalNotesModal modularization, line limits, and contracts.
 * Strictly <= 200 lines.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  INTERNAL NOTES MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every InternalNotes module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/LeadInternalNotesModal.tsx',
    'components/chat/internal_notes/index.ts',
    'components/chat/internal_notes/types.ts',
    'components/chat/internal_notes/styles.ts',
    'components/chat/internal_notes/InternalNotesHeader.tsx',
    'components/chat/internal_notes/InternalNoteCard.tsx',
    'components/chat/internal_notes/InternalNotesEmptyState.tsx',
    'components/chat/internal_notes/InternalNotesComposer.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/internal_notes/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/internal_notes/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { InternalNotesHeader } from './InternalNotesHeader'"));
  assert(content.includes("export { InternalNoteCard } from './InternalNoteCard'"));
  assert(content.includes("export { InternalNotesEmptyState } from './InternalNotesEmptyState'"));
  assert(content.includes("export { InternalNotesComposer } from './InternalNotesComposer'"));
});

// 3. Presenter decoupling verification
test('LeadInternalNotesModal delegates to modular components and stays under limit', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/LeadInternalNotesModal.tsx'), 'utf8');
  assert(content.includes("from './internal_notes'"));
  assert(content.includes('<InternalNotesHeader'));
  assert(content.includes('<InternalNoteCard'));
  assert(content.includes('<InternalNotesEmptyState'));
  assert(content.includes('<InternalNotesComposer'));
});

// 4. Clean Architecture LeadsRepository integration
test('LeadInternalNotesModal integrates leadsRepository.fetchInternalNotes and addInternalNote', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/LeadInternalNotesModal.tsx'), 'utf8');
  assert(content.includes('leadsRepository.fetchInternalNotes'), 'Must invoke leadsRepository.fetchInternalNotes');
  assert(content.includes('leadsRepository.addInternalNote'), 'Must invoke leadsRepository.addInternalNote');
});

// 5. Note composer contracts verification
test('InternalNotesComposer implements text input, submit controls, and loading state', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/internal_notes/InternalNotesComposer.tsx'), 'utf8');
  assert(content.includes('value'));
  assert(content.includes('onChangeText'));
  assert(content.includes('onSubmit'));
  assert(content.includes('isSubmitting'));
  assert(content.includes('placeholder="Add confidential team note..."'));
});

// 6. Note card contracts verification
test('InternalNoteCard renders author, timestamp, body, and shield indicator', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/internal_notes/InternalNoteCard.tsx'), 'utf8');
  assert(content.includes('item.authorName'));
  assert(content.includes('item.body'));
  assert(content.includes('item.createdAt'));
  assert(content.includes('shield-checkmark'));
});

console.log(`\nAll ${passed} Internal Notes modular architecture tests passed successfully.\n`);
