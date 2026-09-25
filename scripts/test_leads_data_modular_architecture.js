/**
 * test_leads_data_modular_architecture.js
 * Verification of useLeadsData modularization, line limits, and contracts.
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
console.log('  LEADS DATA HOOK MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every Leads Data module is strictly <= 200 lines', () => {
  const files = [
    'components/leads/useLeadsData.ts',
    'components/leads/data/index.ts',
    'components/leads/data/leadsQueryHelpers.ts',
    'components/leads/data/manualLeadsOperations.ts',
    'components/leads/data/chatLeadsQueryService.ts',
    'components/leads/data/useManualLeadActions.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/leads/data/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/data/index.ts'), 'utf8');
  assert(content.includes("export * from './leadsQueryHelpers'"));
  assert(content.includes("export * from './manualLeadsOperations'"));
  assert(content.includes("export * from './chatLeadsQueryService'"));
  assert(content.includes("export * from './useManualLeadActions'"));
});

// 3. Fast lookup & Master Lead enrichment contracts
test('useLeadsData preserves O(1) inquiry lookups and masterLeadStatus enrichment', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/useLeadsData.ts'), 'utf8');
  assert(content.includes('const inqById = new Map<string, any>()'), 'Must build inqById Map');
  assert(content.includes('const inqByConvId = new Map<string, any>()'), 'Must build inqByConvId Map');
  assert(
    content.includes("masterLeadStatus: linkedInq?.master_lead_status || r.lead_status || 'new'"),
    'Must enrich mappedChatLeads with masterLeadStatus'
  );
});

// 4. Realtime deduplication contract
test('useLeadsData preserves Realtime deduplication on delchat-leads- channel', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/useLeadsData.ts'), 'utf8');
  assert(content.includes('const channelName = `delchat-leads-${currentUser.id}`'));
  assert(content.includes('removeChannel(existing)'));
});

// 5. Dual-table synchronization & optimistic update contracts
test('useLeadsData preserves dual-table status sync and optimistic state updates', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/useLeadsData.ts'), 'utf8');
  assert(content.includes("from('crm_leads')"));
  assert(content.includes("from('crm_inquiries')"));
  assert(content.includes('master_lead_status: nextStatus'));
  assert(content.includes('masterLeadStatus: nextStatus'));
});

// 6. Manual lead operations delegation contract
test('useLeadsData delegates manual lead actions to useManualLeadActions sub-hook', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/useLeadsData.ts'), 'utf8');
  assert(content.includes('useManualLeadActions(currentUser, setManualLeads, fetchAllLeads)'));
  assert(content.includes('fetchManualCrmLeads'));
  assert(content.includes('computeManualCounts'));
});

console.log(`\nAll ${passed} Leads Data modular architecture tests passed successfully.\n`);
