const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n================================================================');
console.log('  CHAT LEADS VIEW MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_LINES = 200;

const chatLeadsModules = [
  'components/leads/ChatLeadsView.tsx',
  'components/leads/chat_leads/index.ts',
  'components/leads/chat_leads/types.ts',
  'components/leads/chat_leads/styles.ts',
  'components/leads/chat_leads/ChatLeadsSubTabs.tsx',
  'components/leads/chat_leads/ChatLeadsPipelineBar.tsx',
  'components/leads/chat_leads/ChatLeadsCard.tsx',
  'components/leads/chat_leads/ChatLeadsEmptyState.tsx',
  'components/leads/chat_leads/useChatLeadsPartition.ts',
];

let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] ${desc}: ${err.message}`);
    failed++;
  }
}

// 1. Strict Line Count Verification (<= 200 lines per module)
check('Every ChatLeads module is strictly <= 200 lines', () => {
  for (const mod of chatLeadsModules) {
    const fullPath = path.join(ROOT_DIR, mod);
    assert(fs.existsSync(fullPath), `Module ${mod} must exist`);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
    assert(lines <= MAX_LINES, `${mod} has ${lines} lines, exceeding limit of ${MAX_LINES}`);
  }
});

// 2. Barrel index export
check('components/leads/chat_leads/index.ts re-exports all sub-modules', () => {
  const indexPath = path.join(ROOT_DIR, 'components/leads/chat_leads/index.ts');
  const content = fs.readFileSync(indexPath, 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export * from './ChatLeadsSubTabs'"));
  assert(content.includes("export * from './ChatLeadsPipelineBar'"));
  assert(content.includes("export * from './ChatLeadsCard'"));
  assert(content.includes("export * from './ChatLeadsEmptyState'"));
  assert(content.includes("export * from './useChatLeadsPartition'"));
});

// 3. Types module contract
check('components/leads/chat_leads/types.ts defines subTab, props and options', () => {
  const typesPath = path.join(ROOT_DIR, 'components/leads/chat_leads/types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  assert(content.includes('ChatLeadsViewProps'));
  assert(content.includes('ChatSubTab'));
  assert(content.includes('ChatLeadsSubTabsProps'));
  assert(content.includes('ChatLeadsPipelineBarProps'));
  assert(content.includes('ChatLeadsCardProps'));
});

// 4. Sub-Tabs component
check('ChatLeadsSubTabs handles Master and My leads switching', () => {
  const tabsPath = path.join(ROOT_DIR, 'components/leads/chat_leads/ChatLeadsSubTabs.tsx');
  const content = fs.readFileSync(tabsPath, 'utf8');
  assert(content.includes("onSelectSubTab('master')"));
  assert(content.includes("onSelectSubTab('my')"));
  assert(content.includes('masterLeadsCount'));
  assert(content.includes('myLeadsCount'));
});

// 5. Pipeline Bar component
check('ChatLeadsPipelineBar maps CHAT_LEAD_STATUS_OPTIONS with counts', () => {
  const barPath = path.join(ROOT_DIR, 'components/leads/chat_leads/ChatLeadsPipelineBar.tsx');
  const content = fs.readFileSync(barPath, 'utf8');
  assert(content.includes('CHAT_LEAD_STATUS_OPTIONS.map'));
  assert(content.includes('onSelectStatus(st.value)'));
  assert(content.includes('partitionedChatLeads'));
});

// 6. Lead Card component
check('ChatLeadsCard renders status pills, badges, agent chips, and stage actions', () => {
  const cardPath = path.join(ROOT_DIR, 'components/leads/chat_leads/ChatLeadsCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  assert(content.includes('masterLeadBadge'));
  assert(content.includes('unassignedBadge'));
  assert(content.includes('selfAssignedBadge'));
  assert(content.includes('assignedAgentChip'));
  assert(content.includes('openChatBtn'));
  assert(content.includes('onUpdateChatLeadStatus'));
});

// 7. Partition Hook
check('useChatLeadsPartition implements memoized counts and partitioned arrays', () => {
  const hookPath = path.join(ROOT_DIR, 'components/leads/chat_leads/useChatLeadsPartition.ts');
  const content = fs.readFileSync(hookPath, 'utf8');
  assert(content.includes('masterLeadsCount = useMemo'));
  assert(content.includes('myLeadsCount = useMemo'));
  assert(content.includes('partitionedChatLeads = useMemo'));
  assert(content.includes('filteredChatLeads = useMemo'));
});

// 8. Slim Presenter
check('ChatLeadsView is a slim presenter under 200 lines orchestrating sub-views', () => {
  const viewPath = path.join(ROOT_DIR, 'components/leads/ChatLeadsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  const lines = content.split('\n').length;
  assert(lines <= MAX_LINES, `ChatLeadsView is ${lines} lines`);
  assert(content.includes('ChatLeadsSubTabs'));
  assert(content.includes('ChatLeadsPipelineBar'));
  assert(content.includes('ChatLeadsCard'));
  assert(content.includes('ChatLeadsEmptyState'));
});

console.log('\n================================================================');
if (failed > 0) {
  console.error(`  ${failed} CHAT LEADS ARCHITECTURE CHECKS FAILED!`);
  process.exit(1);
} else {
  console.log('  ALL 8 CHAT LEADS ARCHITECTURE CHECKS PASSED!');
  console.log('================================================================\n');
  process.exit(0);
}
