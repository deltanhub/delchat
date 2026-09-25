/**
 * test_lead_capture_modular_architecture.js
 * Verification of LeadCaptureModal modularization, line limits, and contracts.
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
console.log('  LEAD CAPTURE MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every LeadCapture module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/LeadCaptureModal.tsx',
    'components/chat/lead_capture/index.ts',
    'components/chat/lead_capture/types.ts',
    'components/chat/lead_capture/styles.ts',
    'components/chat/lead_capture/LeadCaptureHeader.tsx',
    'components/chat/lead_capture/LeadCaptureFormFields.tsx',
    'components/chat/lead_capture/LeadCaptureActions.tsx',
    'components/chat/lead_capture/useLeadCapture.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/lead_capture/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/lead_capture/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { LeadCaptureHeader } from './LeadCaptureHeader'"));
  assert(content.includes("export { LeadCaptureFormFields } from './LeadCaptureFormFields'"));
  assert(content.includes("export { LeadCaptureActions } from './LeadCaptureActions'"));
  assert(content.includes("export { useLeadCapture } from './useLeadCapture'"));
});

// 3. Presenter decoupling verification
test('LeadCaptureModal delegates to modular components and hook', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/LeadCaptureModal.tsx'), 'utf8');
  assert(content.includes('<LeadCaptureHeader'));
  assert(content.includes('<LeadCaptureFormFields'));
  assert(content.includes('<LeadCaptureActions'));
  assert(content.includes('useLeadCapture'));
});

// 4. Form fields contracts verification
test('LeadCaptureFormFields implements 4 lead input fields and error banner', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/lead_capture/LeadCaptureFormFields.tsx'), 'utf8');
  assert(content.includes('fullName'));
  assert(content.includes('email'));
  assert(content.includes('phone'));
  assert(content.includes('note'));
  assert(content.includes('errorMessage'));
  assert(content.includes('Lead full name'));
});

// 5. Actions contracts verification
test('LeadCaptureActions implements cancel and submit triggers with loading spinner', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/lead_capture/LeadCaptureActions.tsx'), 'utf8');
  assert(content.includes('onClose'));
  assert(content.includes('onSubmit'));
  assert(content.includes('isSubmitting'));
  assert(content.includes('ActivityIndicator'));
  assert(content.includes('Create lead'));
});

console.log(`\nAll ${passed} Lead Capture modular architecture tests passed successfully.\n`);
