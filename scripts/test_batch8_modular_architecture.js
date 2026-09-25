/**
 * test_batch8_modular_architecture.js
 * Verification of Batch 8: Inquiries, Leads Data Layer & CRM Master Lead Sub-Views.
 * Strictly verifies that EVERY file is <= 150 lines and exports/contracts are intact.
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
console.log('  BATCH 8 MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification for all Batch 8 files
test('Every Batch 8 file is strictly <= 150 lines of code', () => {
  const files = [
    // 8.1 Inquiries Data Layer & Responses
    'components/inquiries/data/constants.ts',
    'components/inquiries/data/useInquiryTemplatesMutations.ts',
    'components/inquiries/data/useInquiryFieldsMutations.ts',
    'components/inquiries/data/index.ts',
    'components/inquiries/useInquiriesData.ts',
    'components/inquiries/responses/cardStyles.ts',
    'components/inquiries/responses/InquiryResponseAnswersList.tsx',
    'components/inquiries/responses/styles.ts',
    'components/inquiries/responses/InquiryResponseCard.tsx',
    'components/inquiries/responses/index.ts',
    'components/inquiries/form_builder/fieldCardStyles.ts',
    'components/inquiries/form_builder/styles.ts',
    // 8.2 Leads Data Layer
    'components/leads/data/manualLeadsOperations.ts',
    'components/leads/data/leadsQueryHelpers.ts',
    'components/leads/data/useManualLeadActions.ts',
    'components/leads/data/chatLeadsQueryService.ts',
    'components/leads/data/index.ts',
    'components/leads/useLeadsData.ts',
    // 8.3 Master Lead CRM Sub-Views
    'components/chat/crm/historyStyles.ts',
    'components/chat/crm/MasterLeadHistoryView.tsx',
    'components/chat/crm/summaryStyles.ts',
    'components/chat/crm/MasterLeadSummaryMetrics.tsx',
    'components/chat/crm/MasterLeadSummaryView.tsx',
    'components/chat/crm/notesStyles.ts',
    'components/chat/crm/MasterLeadNoteComposer.tsx',
    'components/chat/crm/MasterLeadNotesView.tsx',
    'components/chat/crm/subHeaderStyles.ts',
    'components/chat/crm/MasterLeadSubHeader.tsx',
    'components/chat/crm/MasterLeadDetailsView.tsx',
    'components/chat/crm/MasterLeadReportsView.tsx',
    'components/chat/crm/MasterLeadActivityView.tsx',
    'components/chat/crm/types.ts',
    'components/chat/crm/index.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 150, `${f} has ${lines} lines, exceeding strict 150 limit!`);
  }
});

// 2. Inquiries data layer contracts
test('Inquiries data layer preserves mutations and query helpers', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/inquiries/useInquiriesData.ts'), 'utf8');
  assert(content.includes('useInquiryTemplatesMutations'));
  assert(content.includes('useInquiryFieldsMutations'));
  assert(content.includes('fetchInquiryResponses'));
});

// 3. Leads data layer contracts
test('Leads data layer preserves O(1) maps, realtime deduplication and sync', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/useLeadsData.ts'), 'utf8');
  assert(content.includes('const inqById = new Map<string, any>()'));
  assert(content.includes('const inqByConvId = new Map<string, any>()'));
  assert(content.includes('const channelName = `delchat-leads-${currentUser.id}`'));
  assert(content.includes('useManualLeadActions'));
});

// 4. CRM Master Lead Sub-Views composition contracts
test('Master Lead CRM components compose clean modular sub-components', () => {
  const details = fs.readFileSync(path.join(ROOT, 'components/chat/crm/MasterLeadDetailsView.tsx'), 'utf8');
  assert(details.includes('<MasterLeadSummaryView'));
  assert(details.includes('<MasterLeadNotesView'));
  assert(details.includes('<MasterLeadHistoryView'));

  const summary = fs.readFileSync(path.join(ROOT, 'components/chat/crm/MasterLeadSummaryView.tsx'), 'utf8');
  assert(summary.includes('<MasterLeadSummaryMetrics'));

  const notes = fs.readFileSync(path.join(ROOT, 'components/chat/crm/MasterLeadNotesView.tsx'), 'utf8');
  assert(notes.includes('<MasterLeadNoteComposer'));

  const subHeader = fs.readFileSync(path.join(ROOT, 'components/chat/crm/MasterLeadSubHeader.tsx'), 'utf8');
  assert(subHeader.includes('ASSIGNED AGENT'));
  assert(subHeader.includes('Handoff Note'));
});

console.log(`\nAll ${passed} Batch 8 modular architecture tests passed successfully.\n`);
