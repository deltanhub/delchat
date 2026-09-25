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

console.log('\n--- Option 30: InquiryFormModal Modular Architecture Audit ---');

const files = [
  'components/chat/InquiryFormModal.tsx',
  'components/chat/inquiry_form/index.ts',
  'components/chat/inquiry_form/types.ts',
  'components/chat/inquiry_form/styles.ts',
  'components/chat/inquiry_form/useInquiryTemplates.ts',
  'components/chat/inquiry_form/InquiryFormHeader.tsx',
  'components/chat/inquiry_form/InquiryFormEmptyState.tsx',
  'components/chat/inquiry_form/InquiryTemplateCard.tsx',
  'components/chat/inquiry_form/InquiryFormLegalNotice.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/InquiryFormModal.tsx'), 'utf8');
assert(presenter.includes('export default function InquiryFormModal'), 'InquiryFormModal default export present');
assert(presenter.includes('export {'), 'Re-exports contracts and types');
assert(presenter.includes('useInquiryTemplates'), 'Presenter wires useInquiryTemplates');
assert(presenter.includes('InquiryFormHeader'), 'Presenter renders InquiryFormHeader');
assert(presenter.includes('InquiryFormEmptyState'), 'Presenter renders InquiryFormEmptyState');
assert(presenter.includes('InquiryTemplateCard'), 'Presenter renders InquiryTemplateCard');
assert(presenter.includes('InquiryFormLegalNotice'), 'Presenter renders InquiryFormLegalNotice');

console.log(`\nInquiryFormModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
