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

console.log('\n--- Option 31: LeadDetailNotesModal Modular Architecture Audit ---');

const files = [
  'components/leads/LeadDetailNotesModal.tsx',
  'components/leads/lead_detail/index.ts',
  'components/leads/lead_detail/types.ts',
  'components/leads/lead_detail/styles.ts',
  'components/leads/lead_detail/LeadDetailHeader.tsx',
  'components/leads/lead_detail/LeadDetailContactActions.tsx',
  'components/leads/lead_detail/LeadDetailPropertyCard.tsx',
  'components/leads/lead_detail/LeadDetailStageSelector.tsx',
  'components/leads/lead_detail/LeadDetailNotesEditor.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/leads/LeadDetailNotesModal.tsx'), 'utf8');
assert(presenter.includes('export default function LeadDetailNotesModal'), 'LeadDetailNotesModal default export present');
assert(presenter.includes('LeadDetailHeader'), 'Presenter renders LeadDetailHeader');
assert(presenter.includes('LeadDetailContactActions'), 'Presenter renders LeadDetailContactActions');
assert(presenter.includes('LeadDetailPropertyCard'), 'Presenter renders LeadDetailPropertyCard');
assert(presenter.includes('LeadDetailStageSelector'), 'Presenter renders LeadDetailStageSelector');
assert(presenter.includes('LeadDetailNotesEditor'), 'Presenter renders LeadDetailNotesEditor');

console.log(`\nLeadDetailNotesModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
