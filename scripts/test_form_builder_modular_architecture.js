/**
 * test_form_builder_modular_architecture.js
 * Verification of InquiryFormBuilderView modularization, line limits, and contracts.
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
console.log('  INQUIRY FORM BUILDER MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every InquiryFormBuilder module is strictly <= 200 lines', () => {
  const files = [
    'components/inquiries/InquiryFormBuilderView.tsx',
    'components/inquiries/form_builder/index.ts',
    'components/inquiries/form_builder/types.ts',
    'components/inquiries/form_builder/styles.ts',
    'components/inquiries/form_builder/FormBuilderTriggerCards.tsx',
    'components/inquiries/form_builder/FormBuilderMetaCard.tsx',
    'components/inquiries/form_builder/FormBuilderFieldsHeader.tsx',
    'components/inquiries/form_builder/FormBuilderFieldCard.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/inquiries/form_builder/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/form_builder/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { FormBuilderTriggerCards } from './FormBuilderTriggerCards'"));
  assert(content.includes("export { FormBuilderMetaCard } from './FormBuilderMetaCard'"));
  assert(content.includes("export { FormBuilderFieldsHeader } from './FormBuilderFieldsHeader'"));
  assert(content.includes("export { FormBuilderFieldCard } from './FormBuilderFieldCard'"));
});

// 3. Types verification
test('components/inquiries/form_builder/types.ts defines necessary props and types', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/form_builder/types.ts'), 'utf8');
  assert(content.includes('export interface InquiryFormBuilderViewProps'));
  assert(content.includes('export interface FormBuilderTriggerCardsProps'));
  assert(content.includes('export interface FormBuilderMetaCardProps'));
  assert(content.includes('export interface FormBuilderFieldCardProps'));
  assert(content.includes('export interface FormBuilderFieldsHeaderProps'));
});

// 4. Presenter decoupling verification
test('InquiryFormBuilderView delegates to modular components and has no inline styles', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/InquiryFormBuilderView.tsx'), 'utf8');
  assert(content.includes("from './form_builder'"));
  assert(content.includes('<FormBuilderTriggerCards'));
  assert(content.includes('<FormBuilderMetaCard'));
  assert(content.includes('<FormBuilderFieldsHeader'));
  assert(content.includes('<FormBuilderFieldCard'));
  assert(!content.includes('StyleSheet.create'), 'Presenter should not declare a separate inline stylesheet');
});

// 5. Trigger cards verification
test('FormBuilderTriggerCards correctly renders tour and question trigger options', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/form_builder/FormBuilderTriggerCards.tsx'), 'utf8');
  assert(content.includes("['tour', 'question']"));
  assert(content.includes('TRIGGER_META'));
  assert(content.includes('onSelectTrigger'));
});

// 6. Meta card verification
test('FormBuilderMetaCard manages status switch, title, and description inputs', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/form_builder/FormBuilderMetaCard.tsx'), 'utf8');
  assert(content.includes('Switch'));
  assert(content.includes('onToggleActive'));
  assert(content.includes('onTitleChange'));
  assert(content.includes('onDescriptionChange'));
  assert(content.includes('onSaveDetails'));
});

// 7. Field card verification
test('FormBuilderFieldCard manages ordering, required status, edit, and delete', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/form_builder/FormBuilderFieldCard.tsx'), 'utf8');
  assert(content.includes('onReorderField'));
  assert(content.includes('onOpenEditModal'));
  assert(content.includes('onDeleteField'));
  assert(content.includes('FIELD_TYPE_LABELS'));
});

console.log(`\nAll ${passed} Inquiry Form Builder modular architecture tests passed successfully.\n`);
