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

console.log('\n--- Option 25: ReportModal Modular Architecture Audit ---');

const files = [
  'components/chat/ReportModal.tsx',
  'components/chat/report/index.ts',
  'components/chat/report/types.ts',
  'components/chat/report/styles.ts',
  'components/chat/report/useReportForm.ts',
  'components/chat/report/ReportHeader.tsx',
  'components/chat/report/ReportReasonSelector.tsx',
  'components/chat/report/ReportDetailsInput.tsx',
  'components/chat/report/ReportConsentToggle.tsx',
  'components/chat/report/ReportActionButtons.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 200, f + ' strictly <= 200 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/ReportModal.tsx'), 'utf8');
assert(presenter.includes('export default function ReportModal'), 'ReportModal default export present');
assert(presenter.includes('export interface ReportModalProps'), 'ReportModalProps interface exported');
assert(presenter.includes('messagesConsent'), 'Presenter wires messagesConsent');
assert(presenter.includes('onSubmitReport: (reason: string, details: string, messagesConsent: boolean) => Promise<void>'), 'onSubmitReport signature preserved');

const toggle = fs.readFileSync(path.join(ROOT, 'components/chat/report/ReportConsentToggle.tsx'), 'utf8');
assert(toggle.includes('Reveal Chat History for Review'), 'Consent toggle contains Reveal Chat History for Review text');

console.log(`\nReportModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
