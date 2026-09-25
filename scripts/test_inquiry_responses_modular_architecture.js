/**
 * test_inquiry_responses_modular_architecture.js
 * Verification of InquiryResponsesView modularization, line limits, and contracts.
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
console.log('  INQUIRY RESPONSES MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every InquiryResponses module is strictly <= 200 lines', () => {
  const files = [
    'components/inquiries/InquiryResponsesView.tsx',
    'components/inquiries/responses/index.ts',
    'components/inquiries/responses/types.ts',
    'components/inquiries/responses/styles.ts',
    'components/inquiries/responses/InquiryMetricCard.tsx',
    'components/inquiries/responses/InquiryFilterBar.tsx',
    'components/inquiries/responses/InquiryResponseCard.tsx',
    'components/inquiries/responses/InquiryEmptyState.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/inquiries/responses/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/responses/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { InquiryMetricCard } from './InquiryMetricCard'"));
  assert(content.includes("export { InquiryFilterBar } from './InquiryFilterBar'"));
  assert(content.includes("export { InquiryResponseCard } from './InquiryResponseCard'"));
  assert(content.includes("export { InquiryEmptyState } from './InquiryEmptyState'"));
});

// 3. Presenter decoupling verification
test('InquiryResponsesView delegates to modular components and has no inline styles', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/InquiryResponsesView.tsx'), 'utf8');
  assert(content.includes("from './responses'"));
  assert(content.includes('<InquiryMetricCard'));
  assert(content.includes('<InquiryFilterBar'));
  assert(content.includes('<InquiryResponseCard'));
  assert(content.includes('<InquiryEmptyState'));
  assert(!content.includes('StyleSheet.create'), 'Presenter should not declare a separate inline stylesheet');
});

// 4. Response card contracts verification
test('InquiryResponseCard implements user initials, open chat button, and answers rendering', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/responses/InquiryResponseCard.tsx'), 'utf8');
  assert(content.includes('initials'));
  assert(content.includes('onOpenChat'));
  assert(content.includes('item.answers'));
  assert(content.includes('Trigger: Request a Tour'));
  assert(content.includes('Trigger: Ask a Question'));
});

// 5. Filter bar contracts verification
test('InquiryFilterBar implements horizontal scroll filter options with count badges', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/responses/InquiryFilterBar.tsx'), 'utf8');
  assert(content.includes('onSelectFilter'));
  assert(content.includes('opt.count'));
  assert(content.includes('ScrollView'));
});

console.log(`\nAll ${passed} Inquiry Responses modular architecture tests passed successfully.\n`);
