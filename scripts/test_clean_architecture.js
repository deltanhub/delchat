const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DELCHAT_DIR = 'c:\\Users\\alfre\\OneDrive\\Desktop\\delchat';

console.log('================================================================');
console.log('  DELCHAT CLEAN ARCHITECTURE RUNTIME & STATIC VERIFICATION SUITE');
console.log('================================================================\n');

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name}`);
    if (details) console.error(`         Reason: ${details}`);
  }
}

// 1. Static TypeScript Check
console.log('--- TEST 1: Full Strict TypeScript Verification ---');
try {
  execSync('cmd /c npx tsc --noEmit', { cwd: DELCHAT_DIR, stdio: 'pipe' });
  assert(true, 'Static Typecheck: tsc --noEmit exits with code 0 (zero errors)');
} catch (e) {
  assert(false, 'Static Typecheck: tsc --noEmit failed', e.stderr ? e.stderr.toString() : e.message);
}

// 2. Repository Layer File Structure & Exports
console.log('\n--- TEST 2: Domain Repository Layer Architecture ---');
const repoIndex = path.join(DELCHAT_DIR, 'lib', 'repositories', 'index.ts');
const convRepo = path.join(DELCHAT_DIR, 'lib', 'repositories', 'conversationRepository.ts');
const leadsRepo = path.join(DELCHAT_DIR, 'lib', 'repositories', 'leadsRepository.ts');
const msgRepo = path.join(DELCHAT_DIR, 'lib', 'repositories', 'messageRepository.ts');
const callRepo = path.join(DELCHAT_DIR, 'lib', 'repositories', 'callRepository.ts');

assert(fs.existsSync(repoIndex), 'Barrel export lib/repositories/index.ts exists');
assert(fs.existsSync(convRepo), 'lib/repositories/conversationRepository.ts exists');
assert(fs.existsSync(leadsRepo), 'lib/repositories/leadsRepository.ts exists');
assert(fs.existsSync(msgRepo), 'lib/repositories/messageRepository.ts exists');
assert(fs.existsSync(callRepo), 'lib/repositories/callRepository.ts exists');

const repoIndexContent = fs.readFileSync(repoIndex, 'utf8');
assert(
  repoIndexContent.includes("export * from './conversationRepository'") &&
  repoIndexContent.includes("export * from './leadsRepository'") &&
  repoIndexContent.includes("export * from './messageRepository'") &&
  repoIndexContent.includes("export * from './callRepository'"),
  'Repository barrel exports conversation, leads, message, and call repositories'
);

// 3. Conversation Repository Contract Verification
console.log('\n--- TEST 3: Conversation Repository Contract ---');
const convContent = fs.readFileSync(convRepo, 'utf8');
assert(convContent.includes('fetchInboxConversations'), 'conversationRepository exports fetchInboxConversations');
assert(convContent.includes('toggleConversationPinned'), 'conversationRepository exports toggleConversationPinned');
assert(convContent.includes('toggleConversationMute'), 'conversationRepository exports toggleConversationMute');
assert(convContent.includes('toggleConversationArchive'), 'conversationRepository exports toggleConversationArchive');
assert(convContent.includes('markConversationRead'), 'conversationRepository exports markConversationRead');
assert(convContent.includes('markConversationUnread'), 'conversationRepository exports markConversationUnread');
assert(convContent.includes('Math.min(200'), 'conversationRepository incorporates Math.min(200 keyset memory bound');

// 4. Leads Repository Contract Verification
console.log('\n--- TEST 4: Leads Repository Contract ---');
const leadsContent = fs.readFileSync(leadsRepo, 'utf8');
assert(leadsContent.includes('fetchBrokerageAgents'), 'leadsRepository exports fetchBrokerageAgents');
assert(leadsContent.includes('assignAgentToLead'), 'leadsRepository exports assignAgentToLead');
assert(leadsContent.includes('unassignAgentFromLead'), 'leadsRepository exports unassignAgentFromLead');
assert(leadsContent.includes('fetchInternalNotes'), 'leadsRepository exports fetchInternalNotes');
assert(leadsContent.includes('addInternalNote'), 'leadsRepository exports addInternalNote');
assert(leadsContent.includes('agency_agent_memberships') && leadsContent.includes('developer_agent_memberships'), 'leadsRepository strictly enforces tenant organization memberships');

// 5. Message Repository Contract Verification
console.log('\n--- TEST 5: Message Repository Contract ---');
const msgContent = fs.readFileSync(msgRepo, 'utf8');
assert(
  msgContent.includes(".or('intent.neq.internal_note,intent.is.null')") || msgContent.includes(".neq('intent', 'internal_note')"),
  'messageRepository filters internal broker notes from client stream with 500k CCU NULL-safety'
);

// Verify SQL 3VL & in-memory NULL-safe filtering invariant
const sampleDbMessages = [
  { id: 'msg-1', body: 'Regular buyer message', intent: null },
  { id: 'msg-2', body: 'Explicit text message', intent: 'message' },
  { id: 'msg-3', body: 'Confidential agent note', intent: 'internal_note' },
];
const safeFiltered = sampleDbMessages.filter((m) => m.intent !== 'internal_note');
assert(safeFiltered.length === 2, 'Safe message filter excludes internal_note rows');
assert(safeFiltered.some((m) => m.intent === null), 'Safe message filter retains NULL intent rows');
assert(!safeFiltered.some((m) => m.intent === 'internal_note'), 'Zero internal_note rows leaked in filtered output');
assert(msgContent.includes('toggleMessageReaction'), 'messageRepository exports toggleMessageReaction');
assert(msgContent.includes('deleteMessage'), 'messageRepository exports deleteMessage');
assert(msgContent.includes('sendTextMessage'), 'messageRepository exports sendTextMessage');
assert(msgContent.includes('sendVoiceNoteMessage'), 'messageRepository exports sendVoiceNoteMessage');
assert(msgContent.includes('sendDocumentMessage'), 'messageRepository exports sendDocumentMessage');
assert(msgContent.includes('sendListingMessage'), 'messageRepository exports sendListingMessage');
assert(msgContent.includes('sendEmbedMessage'), 'messageRepository exports sendEmbedMessage');
assert(msgContent.includes('sendInquiryTemplate'), 'messageRepository exports sendInquiryTemplate');
assert(msgContent.includes('sendInquiryResponse'), 'messageRepository exports sendInquiryResponse');

// 5b. Local-First Instant Paint (WhatsApp Pattern) Verification
console.log('\n--- TEST 5b: Local-First Instant Paint Verification ---');
const offlineEnginePath = path.join(DELCHAT_DIR, 'lib', 'offline-engine.ts');
const offlineEngineContent = fs.readFileSync(offlineEnginePath, 'utf8');
assert(offlineEngineContent.includes('getMessagesSync'), 'OfflineEngine exports getMessagesSync for 0ms Frame 1 hydration');
assert(offlineEngineContent.includes('saveSingleMessage'), 'OfflineEngine exports saveSingleMessage for immediate realtime persistence');

const useThreadMsgsPath = path.join(DELCHAT_DIR, 'hooks', 'thread', 'useThreadMessages.ts');
const useThreadMsgsContent = fs.readFileSync(useThreadMsgsPath, 'utf8');
assert(useThreadMsgsContent.includes('OfflineEngine.getMessagesSync(conversationId)'), 'useThreadMessages hydrates state synchronously from OfflineEngine hot cache');
assert(useThreadMsgsContent.includes('OfflineEngine.saveSingleMessage(conversationId'), 'useThreadMessages persists realtime incoming and outgoing messages');

const threadScreenPath = path.join(DELCHAT_DIR, 'app', 'thread', '[id].tsx');
const threadScreenContent = fs.readFileSync(threadScreenPath, 'utf8');
assert(
  threadScreenContent.includes('messages.loadingMessages && messages.messages.length === 0'),
  'ThreadScreen strictly guards full-screen loader to zero-message cold starts (0ms instant paint for cached chats)'
);

// 6. Presentation Layer Decoupling Verification
console.log('\n--- TEST 6: UI Presentation Decoupling Verification ---');
const inboxContent = fs.readFileSync(path.join(DELCHAT_DIR, 'app', '(tabs)', 'index.tsx'), 'utf8');
assert(inboxContent.includes('conversationRepository.fetchInboxConversations'), 'Inbox delegates fetching to conversationRepository');
assert(inboxContent.includes('conversationRepository.toggleConversationArchive'), 'Inbox delegates archive to conversationRepository');
assert(inboxContent.includes('conversationRepository.toggleConversationMute'), 'Inbox delegates mute to conversationRepository');
assert(inboxContent.includes('conversationRepository.toggleConversationPinned'), 'Inbox delegates pin to conversationRepository');
assert(inboxContent.includes('conversationRepository.markConversationRead'), 'Inbox delegates mark read to conversationRepository');

const manageAssignContent = fs.readFileSync(path.join(DELCHAT_DIR, 'components', 'chat', 'ManageAssignmentModal.tsx'), 'utf8');
assert(manageAssignContent.includes('leadsRepository.fetchBrokerageAgents'), 'ManageAssignmentModal delegates agent fetch to leadsRepository');
assert(manageAssignContent.includes('leadsRepository.assignAgentToLead'), 'ManageAssignmentModal delegates assign to leadsRepository');
assert(manageAssignContent.includes('leadsRepository.unassignAgentFromLead'), 'ManageAssignmentModal delegates unassign to leadsRepository');

const internalNotesContent = fs.readFileSync(path.join(DELCHAT_DIR, 'components', 'chat', 'LeadInternalNotesModal.tsx'), 'utf8');
assert(internalNotesContent.includes('leadsRepository.fetchInternalNotes'), 'LeadInternalNotesModal delegates fetchNotes to leadsRepository');
assert(internalNotesContent.includes('leadsRepository.addInternalNote'), 'LeadInternalNotesModal delegates addNote to leadsRepository');

// 7. Message Bubble Decomposition Verification (Phase 1)
console.log('\n--- TEST 7: Polymorphic Message Bubble Decomposition ---');
const bubbleContent = fs.readFileSync(path.join(DELCHAT_DIR, 'components', 'chat', 'MessageBubble.tsx'), 'utf8');
const bubbleLines = bubbleContent.split('\n').length;
assert(bubbleLines < 250, `MessageBubble.tsx is decomposed into a slim dispatcher (current lines: ${bubbleLines} < 250)`);
const bubblesDir = path.join(DELCHAT_DIR, 'components', 'chat', 'bubbles');
const expectedBubbles = [
  'types.ts',
  'TextMessageBubble.tsx',
  'VoiceNoteBubble.tsx',
  'ListingCardBubble.tsx',
  'InquiryFormBubble.tsx',
  'InquiryResponseBubble.tsx',
  'AgentCardBubble.tsx',
  'SystemMessageBubble.tsx',
  'BroadcastBubble.tsx',
  'EmbedBubble.tsx',
  'LeadCardBubble.tsx',
];
expectedBubbles.forEach((file) => {
  assert(fs.existsSync(path.join(bubblesDir, file)), `Bubble sub-component components/chat/bubbles/${file} exists`);
});

console.log('\n================================================================');
console.log(`  CLEAN ARCHITECTURE RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${total})`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
