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

console.log('\n--- Option 28: InquiryFieldModal Modular Architecture Audit ---');

const files = [
  'components/inquiries/InquiryFieldModal.tsx',
  'components/inquiries/field_modal/index.ts',
  'components/inquiries/field_modal/constants.ts',
  'components/inquiries/field_modal/types.ts',
  'components/inquiries/field_modal/styles.ts',
  'components/inquiries/field_modal/useInquiryFieldForm.ts',
  'components/inquiries/field_modal/InquiryFieldModalHeader.tsx',
  'components/inquiries/field_modal/InquiryFieldTypeSelector.tsx',
  'components/inquiries/field_modal/InquiryFieldOptionsInput.tsx',
  'components/inquiries/field_modal/InquiryFieldRequiredSwitch.tsx',
  'components/inquiries/field_modal/InquiryFieldModalFooter.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/inquiries/InquiryFieldModal.tsx'), 'utf8');
assert(presenter.includes('export const InquiryFieldModal'), 'InquiryFieldModal named export present');
assert(presenter.includes('export { InquiryFieldModalProps }'), 'InquiryFieldModalProps re-exported');
assert(presenter.includes('useInquiryFieldForm'), 'Presenter wires useInquiryFieldForm');
assert(presenter.includes('InquiryFieldModalHeader'), 'Presenter renders InquiryFieldModalHeader');
assert(presenter.includes('InquiryFieldTypeSelector'), 'Presenter renders InquiryFieldTypeSelector');
assert(presenter.includes('InquiryFieldOptionsInput'), 'Presenter renders InquiryFieldOptionsInput');
assert(presenter.includes('InquiryFieldRequiredSwitch'), 'Presenter renders InquiryFieldRequiredSwitch');
assert(presenter.includes('InquiryFieldModalFooter'), 'Presenter renders InquiryFieldModalFooter');

console.log(`\nInquiryFieldModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
