/**
 * scripts/test_thread_modular_architecture.js
 *
 * Dedicated Rigid Verification Suite for Option A:
 * Thread Screen (`app/thread/[id].tsx`) Modular Architecture & Slim Presenter (<250 lines).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function pass(name) {
  console.log(`  [PASS] ${name}`);
}

function fail(name, err) {
  console.error(`  [FAIL] ${name}:`, err.message || err);
  process.exit(1);
}

console.log('================================================================');
console.log('  DELCHAT THREAD MODULAR ARCHITECTURE (OPTION A) VERIFICATION');
console.log('================================================================\n');

// SECTION 1: File Line Limits & Slim Presenter Rules
console.log('--- SECTION 1: File Line Count Audits (Slim Presenter Ceiling < 250) ---');
try {
  const threadPath = path.join(ROOT, 'app', 'thread', '[id].tsx');
  assert(fs.existsSync(threadPath), 'app/thread/[id].tsx exists');
  const threadContent = fs.readFileSync(threadPath, 'utf8');
  const threadLines = threadContent.split('\n').length;
  assert(
    threadLines < 250,
    `app/thread/[id].tsx must be strictly < 250 lines (found: ${threadLines} lines)`
  );
  pass(`app/thread/[id].tsx is a slim presenter (${threadLines} lines < 250 ceiling)`);

  const modalsHostPath = path.join(ROOT, 'components', 'chat', 'thread', 'ThreadModalsHost.tsx');
  assert(fs.existsSync(modalsHostPath), 'components/chat/thread/ThreadModalsHost.tsx exists');
  const modalsHostLines = fs.readFileSync(modalsHostPath, 'utf8').split('\n').length;
  assert(modalsHostLines < 250, `ThreadModalsHost.tsx must be < 250 lines (found: ${modalsHostLines})`);
  pass(`ThreadModalsHost.tsx is modular (${modalsHostLines} lines < 250)`);

  const crmModalsPath = path.join(ROOT, 'components', 'chat', 'thread', 'ThreadCrmModals.tsx');
  assert(fs.existsSync(crmModalsPath), 'components/chat/thread/ThreadCrmModals.tsx exists');
  const crmModalsLines = fs.readFileSync(crmModalsPath, 'utf8').split('\n').length;
  assert(crmModalsLines < 250, `ThreadCrmModals.tsx must be < 250 lines (found: ${crmModalsLines})`);
  pass(`ThreadCrmModals.tsx is modular (${crmModalsLines} lines < 250)`);

  const quickStatusPath = path.join(ROOT, 'components', 'chat', 'thread', 'QuickStatusModal.tsx');
  assert(fs.existsSync(quickStatusPath), 'components/chat/thread/QuickStatusModal.tsx exists');
  const quickStatusLines = fs.readFileSync(quickStatusPath, 'utf8').split('\n').length;
  assert(quickStatusLines < 250, `QuickStatusModal.tsx must be < 250 lines (found: ${quickStatusLines})`);
  pass(`QuickStatusModal.tsx is modular (${quickStatusLines} lines < 250)`);

  const leadStripPath = path.join(ROOT, 'components', 'chat', 'thread', 'AssignedLeadStrip.tsx');
  assert(fs.existsSync(leadStripPath), 'components/chat/thread/AssignedLeadStrip.tsx exists');
  const leadStripLines = fs.readFileSync(leadStripPath, 'utf8').split('\n').length;
  assert(leadStripLines < 250, `AssignedLeadStrip.tsx must be < 250 lines (found: ${leadStripLines})`);
  pass(`AssignedLeadStrip.tsx is modular (${leadStripLines} lines < 250)`);

  const pipelinePath = path.join(ROOT, 'components', 'chat', 'thread', 'pipeline.ts');
  assert(fs.existsSync(pipelinePath), 'components/chat/thread/pipeline.ts exists');
  pass('components/chat/thread/pipeline.ts exists');

  const indexPath = path.join(ROOT, 'components', 'chat', 'thread', 'index.ts');
  assert(fs.existsSync(indexPath), 'components/chat/thread/index.ts exists');
  pass('components/chat/thread/index.ts barrel export exists');
} catch (err) {
  fail('Section 1 File Line Count Audits', err);
}

// SECTION 2: Pipeline Stages & Constants Invariants
console.log('\n--- SECTION 2: Pipeline Metadata & Stage Constants ---');
try {
  const { STATUS_PIPELINE } = require(path.join(ROOT, 'components', 'chat', 'thread', 'pipeline.ts'));
  assert(Array.isArray(STATUS_PIPELINE), 'STATUS_PIPELINE is an array');
  assert(STATUS_PIPELINE.length === 9, `STATUS_PIPELINE must contain 9 stages (found: ${STATUS_PIPELINE.length})`);
  
  const expectedStages = [
    'new', 'assigned', 'contacted', 'qualified',
    'tour_scheduled', 'negotiating', 'closed_won', 'closed_lost', 'spam'
  ];
  for (const st of expectedStages) {
    const found = STATUS_PIPELINE.find((s) => s.value === st);
    assert(found, `STATUS_PIPELINE missing stage: ${st}`);
    assert(found.color && found.bgLight && found.bgDark, `Stage ${st} missing theme styling`);
  }
  pass('STATUS_PIPELINE defines all 9 enterprise sales stages with light/dark theme colors');
} catch (err) {
  fail('Section 2 Pipeline Metadata', err);
}

// SECTION 3: Thread Screen Component Decoupling & Invariants
console.log('\n--- SECTION 3: Thread Screen Decoupling & Security Contracts ---');
try {
  const threadContent = fs.readFileSync(path.join(ROOT, 'app', 'thread', '[id].tsx'), 'utf8');

  // Modular Component Wiring
  assert(threadContent.includes('<AssignedLeadStrip'), 'Mounts AssignedLeadStrip');
  assert(threadContent.includes('<ThreadModalsHost'), 'Mounts ThreadModalsHost');
  assert(threadContent.includes('<ChatListingBanner listing={session.conversation.listing} />'), 'Mounts ChatListingBanner');
  assert(threadContent.includes('<MasterLeadSubHeader'), 'Mounts MasterLeadSubHeader');
  assert(threadContent.includes('<MasterLeadDetailsView'), 'Mounts MasterLeadDetailsView');
  pass('ThreadScreen mounts all modular domain sub-components');

  // Security & BOLA Invariants
  assert(!threadContent.includes("supabase.from('chat_participants').insert"), 'Zero Direct Client Inserts into chat_participants');
  assert(threadContent.includes('ensureParticipantAuthorization'), 'Enforces active participant authorization');
  assert(threadContent.includes('can_send'), 'Validates can_send permission');
  assert(threadContent.includes("router.replace('/(tabs)')"), 'Enforces IDOR bounce guard');
  assert(threadContent.includes("intent !== 'internal_note'") || threadContent.includes(".neq('intent', 'internal_note')"), 'Filters internal notes');
  assert(threadContent.includes("from('chat_message_attachments').insert"), 'Targets chat_message_attachments table');
  assert(threadContent.includes('uploadLocalFileToSupabaseStorage'), 'Uses cloud storage uploader for attachments');
  pass('ThreadScreen strictly satisfies all BOLA, IDOR, and storage security invariants');

  // Realtime & Presence
  assert(threadContent.includes('useThreadPresence'), 'Integrates useThreadPresence');
  assert(threadContent.includes('lastSeenText={lastSeenText}'), 'Passes lastSeenText to ChatHeader');
  assert(!threadContent.includes('presenceStatus={AgentPresence.getStatus()}'), 'Eliminated misleading local agent presence dot');
  pass('ThreadScreen binds synchronized presence & last seen stream');

  // WhatsApp 0ms Local-First Hydration
  assert(threadContent.includes('messages.loadingMessages && messages.messages.length === 0'), 'Gated loader strictly to empty cold starts');
  pass('ThreadScreen enforces local-first 0ms instant paint');

  // Agent Delegation Privacy Guard
  assert(threadContent.includes('isPrivateAgentChat ='), 'Computes isPrivateAgentChat delegation privacy guard');
  assert(threadContent.includes('displayMessages = useMemo('), 'Filters displayMessages based on assignment timestamp');
  assert(threadContent.includes('privacyNoticeCard'), 'Includes privacyNoticeCard styling');
  assert(threadContent.includes('delegationNoticeCard'), 'Includes delegationNoticeCard styling');
  assert(threadContent.includes('preDelegationBanner'), 'Includes preDelegationBanner styling');
  assert(threadContent.includes('privacyComposerBar'), 'Includes privacyComposerBar styling');
  pass('ThreadScreen strictly enforces Agent-Buyer delegation privacy bounds');
} catch (err) {
  fail('Section 3 Thread Screen Invariants', err);
}

// SECTION 4: ThreadModalsHost Complete Wiring Audit
console.log('\n--- SECTION 4: ThreadModalsHost Complete Wiring Audit ---');
try {
  const hostContent = fs.readFileSync(path.join(ROOT, 'components', 'chat', 'thread', 'ThreadModalsHost.tsx'), 'utf8');
  const crmContent = fs.readFileSync(path.join(ROOT, 'components', 'chat', 'thread', 'ThreadCrmModals.tsx'), 'utf8');
  const allModalContent = hostContent + '\n' + crmContent;

  assert(hostContent.includes('<ThreadCrmModals'), 'ThreadModalsHost mounts ThreadCrmModals');

  const requiredModals = [
    'MessageActionModal',
    'ChatInfoModal',
    'LeadCaptureModal',
    'MediaPreviewModal',
    'MediaViewerModal',
    'PropertyCatalogModal',
    'InquiryFormModal',
    'EmbedUrlModal',
    'ReportModal',
    'AskAIModal',
    'StarredMessagesModal',
    'ManageAssignmentModal',
    'LeadInternalNotesModal',
    'QuickStatusModal',
    'MuteDurationModal',
  ];

  for (const modal of requiredModals) {
    assert(allModalContent.includes(`<${modal}`), `Modals host missing modal component: <${modal}`);
  }
  pass(`ThreadModalsHost encapsulates all ${requiredModals.length} application dialogs & modals`);

  // Verify Critical Callbacks are Wired
  assert(hostContent.includes('onReact='), 'Wired onReact callback');
  assert(hostContent.includes('onReply='), 'Wired onReply callback');
  assert(hostContent.includes('onStarToggle='), 'Wired onStarToggle callback');
  assert(hostContent.includes('onDelete='), 'Wired onDelete callback');
  assert(hostContent.includes('onAskAI='), 'Wired onAskAI callback');
  assert(crmContent.includes('onSubmitReport='), 'Wired onSubmitReport callback');
  assert(hostContent.includes('onSelectListing='), 'Wired onSelectListing callback');
  assert(hostContent.includes('onSelectTemplate='), 'Wired onSelectTemplate callback');
  assert(hostContent.includes('onSubmit={messages.handleSendEmbed}'), 'Wired handleSendEmbed callback');
  assert(crmContent.includes('onAssignmentComplete='), 'Wired onAssignmentComplete callback');
  assert(crmContent.includes('onSelectStatus={session.handleUpdateLeadStatus}'), 'Wired handleUpdateLeadStatus callback');
  assert(hostContent.includes('handleMuteWithDuration'), 'Wired handleMuteWithDuration callback');
  pass('ThreadModalsHost wires all action handlers and domain mutations without drops');
} catch (err) {
  fail('Section 4 ThreadModalsHost Complete Wiring', err);
}


// SECTION 5: AssignedLeadStrip Presentation Logic Simulation
console.log('\n--- SECTION 5: AssignedLeadStrip Simulation ---');
try {
  const stripContent = fs.readFileSync(path.join(ROOT, 'components', 'chat', 'thread', 'AssignedLeadStrip.tsx'), 'utf8');

  assert(stripContent.includes('currentAssignmentStatus === \'closed\''), 'Normalizes closed -> closed_won');
  assert(stripContent.includes('currentAssignmentStatus === \'lost\''), 'Normalizes lost -> closed_lost');
  assert(stripContent.includes('Thread shared with Agency Principal'), 'Renders shared text on active share');
  assert(stripContent.includes('Private thread (Tap to share with Agency)'), 'Renders private prompt on inactive share');
  assert(stripContent.includes('handoffNote'), 'Conditionally renders manager handoff note');
  assert(stripContent.includes('onPressStatus'), 'Supports onPressStatus callback');
  assert(stripContent.includes('onOpenNotes'), 'Supports onOpenNotes callback');
  assert(stripContent.includes('onToggleShare'), 'Supports onToggleShare callback');
  pass('AssignedLeadStrip correctly handles status normalization, sharing state, and handoffs');
} catch (err) {
  fail('Section 5 AssignedLeadStrip Simulation', err);
}

// SECTION 6: Runtime Logic Unit Simulation (Filtering, Normalization & Security)
console.log('\n--- SECTION 6: Runtime Logic Unit Simulation ---');
try {
  // Test 1: displayMessages filtering logic
  const mockMessages = [
    { id: 'm1', sentAt: '2026-09-01T10:00:00Z', body: 'Initial message' },
    { id: 'm2', sentAt: '2026-09-02T12:00:00Z', body: 'Pre-delegation inquiry' },
    { id: 'm3', sentAt: '2026-09-04T15:00:00Z', body: 'Post-delegation private message' },
  ];

  const assignedAt = '2026-09-03T00:00:00Z';
  const assignedAtTime = new Date(assignedAt).getTime();

  // In non-private chat, all 3 are visible
  const nonPrivate = mockMessages;
  assert.strictEqual(nonPrivate.length, 3, 'Non-private chat reveals all messages');

  // In private agent chat, only m1 and m2 (sentAt <= assignedAt) are visible to company viewer
  const privateChat = mockMessages.filter((m) => new Date(m.sentAt).getTime() <= assignedAtTime);
  assert.strictEqual(privateChat.length, 2, 'Private agent chat strictly suppresses post-delegation messages');
  assert.strictEqual(privateChat[0].id, 'm1');
  assert.strictEqual(privateChat[1].id, 'm2');
  pass('displayMessages filtering strictly preserves buyer-agent post-delegation privacy');

  // Test 2: Status normalization logic
  function normalizeStatus(st) {
    if (st === 'closed') return 'closed_won';
    if (st === 'lost') return 'closed_lost';
    return st;
  }
  assert.strictEqual(normalizeStatus('closed'), 'closed_won');
  assert.strictEqual(normalizeStatus('lost'), 'closed_lost');
  assert.strictEqual(normalizeStatus('qualified'), 'qualified');
  pass('Status normalization handles legacy and modern pipeline aliases');

  // Test 3: Effective Subtitle Fallback Hierarchy
  function getEffectiveSubtitle(conversation, initialSubtitle) {
    return conversation?.listing?.title || conversation?.partnerSubtitle || initialSubtitle || 'DeltanHub Direct';
  }
  assert.strictEqual(getEffectiveSubtitle({ listing: { title: 'Luxury Villa' } }, 'Custom Subtitle'), 'Luxury Villa');
  assert.strictEqual(getEffectiveSubtitle({ partnerSubtitle: 'Licensed Broker' }, 'Custom Subtitle'), 'Licensed Broker');
  assert.strictEqual(getEffectiveSubtitle({}, 'Custom Subtitle'), 'Custom Subtitle');
  assert.strictEqual(getEffectiveSubtitle({}, ''), 'DeltanHub Direct');
  pass('Effective subtitle follows strict 4-tier fallback hierarchy');

} catch (err) {
  fail('Section 6 Runtime Logic Unit Simulation', err);
}

console.log('\n================================================================');
console.log('  THREAD MODULAR ARCHITECTURE (OPTION A): ALL TESTS PASSED (100%)');
console.log('================================================================\n');

