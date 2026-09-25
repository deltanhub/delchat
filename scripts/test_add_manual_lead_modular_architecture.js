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

console.log('\n--- Option 24: AddManualLeadModal Modular Architecture Audit ---');

const files = [
  'components/leads/AddManualLeadModal.tsx',
  'components/leads/add_lead/index.ts',
  'components/leads/add_lead/types.ts',
  'components/leads/add_lead/styles.ts',
  'components/leads/add_lead/useAddManualLeadForm.ts',
  'components/leads/add_lead/AddManualLeadHeader.tsx',
  'components/leads/add_lead/AddManualLeadContactFields.tsx',
  'components/leads/add_lead/AddManualLeadPropertyFields.tsx',
  'components/leads/add_lead/AddManualLeadNotesFields.tsx',
  'components/leads/add_lead/AddManualLeadSubmitButton.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 200, f + ' strictly <= 200 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/leads/AddManualLeadModal.tsx'), 'utf8');
assert(presenter.includes('export default function AddManualLeadModal'), 'AddManualLeadModal default export present');
assert(presenter.includes('export type { AddManualLeadModalProps, AddManualLeadFormData }') || presenter.includes('AddManualLeadModalProps'), 'Types exported');

const hook = fs.readFileSync(path.join(ROOT, 'components/leads/add_lead/useAddManualLeadForm.ts'), 'utf8');
assert(hook.includes('export function useAddManualLeadForm'), 'useAddManualLeadForm hook exported');
assert(hook.includes('handleSave'), 'useAddManualLeadForm provides handleSave');

console.log(`\nAddManualLeadModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
