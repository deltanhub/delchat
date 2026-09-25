/**
 * DELCHAT CRM MASTER LEAD DETAILS MODULAR ARCHITECTURE VERIFICATION SUITE
 *
 * Verifies:
 * 1. Line count audits on all CRM files (target <= 200, ceiling < 250)
 * 2. Repository delegation (leadsRepository.fetchInternalNotes, leadsRepository.addInternalNote)
 * 3. Zero raw database queries into master_lead_internal_notes
 * 4. Component deconstruction and barrel export integrity
 * 5. Hook contracts in useMasterLeadDetails.ts
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('  DELCHAT MASTER LEAD DETAILS MODULAR ARCHITECTURE VERIFICATION');
console.log('================================================================\n');

// SECTION 1: File Line Counts
console.log('--- SECTION 1: File Line Count Audits (Target <= 200, Ceiling < 250) ---');
const crmFiles = [
  { path: 'components/chat/crm/MasterLeadDetailsView.tsx', max: 200, desc: 'MasterLeadDetailsView.tsx' },
  { path: 'hooks/crm/useMasterLeadDetails.ts', max: 200, desc: 'useMasterLeadDetails.ts' },
  { path: 'components/chat/crm/MasterLeadSummaryView.tsx', max: 200, desc: 'MasterLeadSummaryView.tsx' },
  { path: 'components/chat/crm/MasterLeadNotesView.tsx', max: 200, desc: 'MasterLeadNotesView.tsx' },
  { path: 'components/chat/crm/MasterLeadHistoryView.tsx', max: 200, desc: 'MasterLeadHistoryView.tsx' },
  { path: 'components/chat/crm/MasterLeadReportsView.tsx', max: 200, desc: 'MasterLeadReportsView.tsx' },
  { path: 'components/chat/crm/MasterLeadActivityView.tsx', max: 200, desc: 'MasterLeadActivityView.tsx' },
  { path: 'components/chat/crm/types.ts', max: 100, desc: 'components/chat/crm/types.ts' },
  { path: 'components/chat/crm/index.ts', max: 50, desc: 'components/chat/crm/index.ts' },
];

for (const f of crmFiles) {
  const fullPath = path.join(ROOT, f.path);
  assert(fs.existsSync(fullPath), `${f.desc} exists on disk`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  assert(
    lineCount <= f.max,
    `${f.desc} is modular (${lineCount} lines <= ${f.max} ceiling)`
  );
}

// SECTION 2: Clean Architecture & Repository Delegation
console.log('\n--- SECTION 2: Clean Architecture & Invariants Verification ---');
const presenterCode = fs.readFileSync(path.join(ROOT, 'components/chat/crm/MasterLeadDetailsView.tsx'), 'utf8');
const hookCode = fs.readFileSync(path.join(ROOT, 'hooks/crm/useMasterLeadDetails.ts'), 'utf8');

assert(
  presenterCode.includes('leadsRepository.fetchInternalNotes') || hookCode.includes('leadsRepository.fetchInternalNotes'),
  'Internal notes fetching delegates to leadsRepository.fetchInternalNotes'
);
assert(
  presenterCode.includes('leadsRepository.addInternalNote') || hookCode.includes('leadsRepository.addInternalNote'),
  'Internal note creation delegates to leadsRepository.addInternalNote'
);
assert(
  !presenterCode.includes(".from('master_lead_internal_notes')") && !hookCode.includes(".from('master_lead_internal_notes')"),
  'MasterLeadDetailsView strictly eliminates raw database calls to master_lead_internal_notes'
);

// SECTION 3: Component Composition & Submodule Mounting Audit
console.log('\n--- SECTION 3: Component Composition & Submodule Mounting Audit ---');
assert(
  presenterCode.includes('<MasterLeadSummaryView') &&
  presenterCode.includes('<MasterLeadNotesView') &&
  presenterCode.includes('<MasterLeadHistoryView') &&
  presenterCode.includes('<MasterLeadReportsView') &&
  presenterCode.includes('<MasterLeadActivityView'),
  'MasterLeadDetailsView mounts all 5 specialized sub-view components'
);
assert(
  presenterCode.includes('useMasterLeadDetails('),
  'MasterLeadDetailsView delegates all orchestration state to useMasterLeadDetails hook'
);

// SECTION 4: Barrel Export Verification
console.log('\n--- SECTION 4: Barrel Export Verification ---');
const indexCode = fs.readFileSync(path.join(ROOT, 'components/chat/crm/index.ts'), 'utf8');
assert(
  indexCode.includes('MasterLeadDetailsView') &&
  indexCode.includes('MasterLeadSummaryView') &&
  indexCode.includes('MasterLeadNotesView') &&
  indexCode.includes('MasterLeadHistoryView') &&
  indexCode.includes('MasterLeadReportsView') &&
  indexCode.includes('MasterLeadActivityView'),
  'components/chat/crm/index.ts cleanly exports all sub-components'
);

console.log('\n================================================================');
console.log(`  MASTER LEAD DETAILS MODULAR ARCHITECTURE: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
