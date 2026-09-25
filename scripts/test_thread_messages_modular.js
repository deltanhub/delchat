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

console.log('\n--- Thread Messages Domain Hook Modular Architecture Audit ---');

const files = [
  'hooks/thread/useThreadMessages.ts',
  'hooks/thread/messages/index.ts',
  'hooks/thread/messages/types.ts',
  'hooks/thread/messages/realtimePayloadResolver.ts',
  'hooks/thread/messages/useMessagesState.ts',
  'hooks/thread/messages/useMessagePagination.ts',
  'hooks/thread/messages/useMessageQueue.ts',
  'hooks/thread/messages/useThreadRealtime.ts',
  'hooks/thread/messages/useTextMessageSend.ts',
  'hooks/thread/messages/useStructuredMessageSend.ts',
  'hooks/thread/messages/useMessageItemActions.ts',
  'hooks/thread/messages/outboxHelper.ts',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, f + ' strictly <= 150 LOC (' + lines + ' lines)');
}

const orchestrator = fs.readFileSync(path.join(ROOT, 'hooks/thread/useThreadMessages.ts'), 'utf8');
assert(orchestrator.includes('export function useThreadMessages'), 'useThreadMessages export present');
assert(orchestrator.includes('OfflineEngine.getMessagesSync(conversationId)'), 'Preserves 0ms Frame 1 hydration');
assert(orchestrator.includes('OfflineEngine.saveSingleMessage(conversationId'), 'Preserves realtime message persistence assertion');
assert(orchestrator.includes('chat-thread-realtime-'), 'Preserves realtime channel topic naming');
assert(orchestrator.includes('supabase.getChannels()'), 'Preserves channel registry deduplication check');
assert(orchestrator.includes('supabase.removeChannel'), 'Preserves lifecycle cleanup hook');

console.log(`\nThread Messages Modular Architecture: ${passed} / ${total} tests passed.\n`);
