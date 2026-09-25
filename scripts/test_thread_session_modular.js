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

console.log('\n--- Thread Session Domain Hook Modular Architecture Audit ---');

const files = [
  'hooks/thread/useThreadSession.ts',
  'hooks/thread/session/index.ts',
  'hooks/thread/session/types.ts',
  'hooks/thread/session/sessionResolutionHelper.ts',
  'hooks/thread/session/sessionRemoteFetchers.ts',
  'hooks/thread/session/useSessionState.ts',
  'hooks/thread/session/useConversationDetailsFetch.ts',
  'hooks/thread/session/useSessionAuthInit.ts',
  'hooks/thread/session/useSessionLeadActions.ts',
  'hooks/thread/session/useSessionHeaderActions.ts',
  'hooks/thread/session/useSessionReportAction.ts',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const orchestrator = fs.readFileSync(path.join(ROOT, 'hooks/thread/useThreadSession.ts'), 'utf8');
assert(orchestrator.includes('export function useThreadSession'), 'useThreadSession export present');
assert(orchestrator.includes('OfflineEngine.getConversationSync(conversationId)'), 'Preserves 0ms Frame 1 conversation hydration');
assert(orchestrator.includes('void fetchConversationDetails(user)'), 'Preserves mount fetchConversationDetails trigger');

console.log(`\nThread Session Modular Architecture: ${passed} / ${total} tests passed.\n`);
