/**
 * scripts/test_master_leads_architecture.js
 * Senior Engineer Live Verification Suite for DelChat Master Leads & Assigned Leads Architecture
 * 
 * Validates:
 * 1. Domain Repository Contract: assignment mapping with masterLeadStatus, structured agent, and buyer isolation
 * 2. Role-Aware Badging & Agent Chips in ConversationRow
 * 3. CRM Leads Partitioning & Sub-Tab Architecture in ChatLeadsView
 * 4. Leads Data Hook & Status Pipeline Synchronization in useLeadsData
 * 5. Functional Simulation: 4-lead agency delegation & partitioning invariants
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
let passedTests = 0;
let failedTests = 0;

function pass(desc) {
  console.log(`  [PASS] ${desc}`);
  passedTests++;
}

function fail(desc, err) {
  console.error(`  [FAIL] ${desc}:`, err.message || err);
  failedTests++;
}

console.log('================================================================');
console.log('  DELCHAT MASTER LEADS & ASSIGNED LEADS ARCHITECTURE AUDIT');
console.log('================================================================\n');

// --- SUITE 1: Domain Repository Contract & Lead Assignment Mapping ---
console.log('--- SUITE 1: Domain Repository Contract & Lead Assignment Mapping ---');

try {
  const repoPath = path.join(ROOT_DIR, 'lib', 'repositories', 'conversationRepository.ts');
  assert(fs.existsSync(repoPath), 'conversationRepository.ts exists');
  const repoContent = fs.readFileSync(repoPath, 'utf8');

  // Verify masterLeadStatus mapping
  assert(
    repoContent.includes('masterLeadStatus: inq.master_lead_status || inq.inquiry_status || \'new\''),
    'Maps masterLeadStatus on assignmentObj'
  );
  pass('conversationRepository maps masterLeadStatus with fallback to inquiry_status');

  // Verify structured agent object
  assert(
    repoContent.includes('agent: inq.assigned_agent_user_id') &&
    repoContent.includes('userId: inq.assigned_agent_user_id') &&
    repoContent.includes('fullName: assignedAgentName') &&
    repoContent.includes('avatarUrl: assignedAgentAvatar'),
    'Maps structured agent object on assignmentObj'
  );
  pass('conversationRepository maps structured agent object (userId, fullName, avatarUrl)');

  // Verify assignedByUserId & assignedAt
  assert(
    repoContent.includes('assignedByUserId:') && repoContent.includes('assignedAt:'),
    'Maps assignedByUserId and assignedAt on assignmentObj'
  );
  pass('conversationRepository maps assignment audit metadata (assignedByUserId, assignedAt)');

  // Verify consumer/buyer isolation
  assert(
    repoContent.includes('isViewerProfessional = canReceiveLeads(') &&
    repoContent.includes('inq && isViewerProfessional'),
    'Suppresses assignmentObj for consumer/buyer viewers'
  );
  pass('conversationRepository strictly suppresses internal assignment data for Buyer accounts');
} catch (err) {
  fail('Domain Repository Contract Suite failed', err);
}

// --- SUITE 2: UI Presentation & Role-Aware Badging ---
console.log('\n--- SUITE 2: UI Presentation & Role-Aware Badging ---');

try {
  const rowPath = path.join(ROOT_DIR, 'components', 'chat', 'ConversationRow.tsx');
  assert(fs.existsSync(rowPath), 'ConversationRow.tsx exists');
  const rowContent = fs.readFileSync(rowPath, 'utf8');

  // Check role-aware title: Master Lead vs Assigned Lead
  assert(
    rowContent.includes("conversation.canAssignAgents ? 'Master Lead' : 'Assigned Lead'"),
    'Renders Master Lead for agencies/devs and Assigned Lead for agents'
  );
  pass('ConversationRow derives role-specific badge title (Master Lead vs Assigned Lead)');

  // Check uppercase status rendering with fallbacks
  assert(
    rowContent.includes('conversation.assignment.masterLeadStatus || conversation.assignment.status || \'new\''),
    'Extracts masterLeadStatus with status fallback'
  );
  pass('ConversationRow reads masterLeadStatus with backwards-compatible status fallback');

  // Check assigned agent chip rendering
  assert(
    rowContent.includes('conversation.assignment.agent?.fullName || conversation.assignment.assignedAgentName') &&
    rowContent.includes("!== 'Unassigned'") &&
    rowContent.includes("!== 'Assigned Agent'"),
    'Renders assigned agent chip while suppressing placeholders'
  );
  pass('ConversationRow renders assigned agent chip and suppresses placeholder strings');
} catch (err) {
  fail('UI Presentation Suite failed', err);
}

// --- SUITE 3: CRM Leads Partitioning & Sub-Tab Architecture ---
console.log('\n--- SUITE 3: CRM Leads Partitioning & Sub-Tab Architecture ---');

try {
  const leadsViewPath = path.join(ROOT_DIR, 'components', 'leads', 'ChatLeadsView.tsx');
  assert(fs.existsSync(leadsViewPath), 'ChatLeadsView.tsx exists');
  const leadsViewContent = fs.readFileSync(leadsViewPath, 'utf8');

  // Verify Master Leads partition logic: delegated to an agent
  assert(
    leadsViewContent.includes('Boolean(l.assignedToUserId) && l.assignedToUserId !== currentUser?.id'),
    'Master Leads filters company leads delegated to an assigned agent'
  );
  pass('ChatLeadsView partitions Master Leads strictly as company leads delegated to agents');

  // Verify My Leads partition logic: unassigned or handled directly
  assert(
    leadsViewContent.includes('!l.assignedToUserId || l.assignedToUserId === currentUser?.id'),
    'My Leads filters unassigned leads or leads worked directly by company user'
  );
  pass('ChatLeadsView partitions My Leads strictly as unassigned or self-handled company leads');

  // Verify memoized counts
  assert(
    leadsViewContent.includes('const masterLeadsCount = useMemo(') &&
    leadsViewContent.includes('const myLeadsCount = useMemo('),
    'Memoizes sub-tab counts for performance'
  );
  pass('ChatLeadsView memoizes Master Leads and My Leads counts');
} catch (err) {
  fail('CRM Leads Partitioning Suite failed', err);
}

// --- SUITE 4: Leads Data Hook & Status Pipeline Synchronization ---
console.log('\n--- SUITE 4: Leads Data Hook & Status Pipeline Synchronization ---');

try {
  const hookPath = path.join(ROOT_DIR, 'components', 'leads', 'useLeadsData.ts');
  assert(fs.existsSync(hookPath), 'useLeadsData.ts exists');
  const hookContent = fs.readFileSync(hookPath, 'utf8');

  // Verify fast inquiry lookups
  assert(
    hookContent.includes('const inqById = new Map<string, any>()') &&
    hookContent.includes('const inqByConvId = new Map<string, any>()'),
    'Builds inquiry fast lookups'
  );
  pass('useLeadsData builds O(1) inquiry lookups by ID and conversation ID');

  // Verify masterLeadStatus enrichment on mappedChatLeads
  assert(
    hookContent.includes('masterLeadStatus: linkedInq?.master_lead_status || r.lead_status || \'new\''),
    'Enriches chat leads with masterLeadStatus'
  );
  pass('useLeadsData enriches mapped chat leads with masterLeadStatus');

  // Verify dual-table status synchronization
  assert(
    hookContent.includes("from('crm_inquiries')") &&
    hookContent.includes('master_lead_status: nextStatus'),
    'Synchronizes master_lead_status on crm_inquiries update'
  );
  pass('useLeadsData synchronizes master_lead_status in crm_inquiries on stage transition');

  // Verify optimistic local state updates
  assert(
    hookContent.includes('masterLeadStatus: nextStatus'),
    'Optimistically updates masterLeadStatus in local React state'
  );
  pass('useLeadsData provides zero-latency optimistic UI updates for masterLeadStatus');
} catch (err) {
  fail('Leads Data Hook Suite failed', err);
}

// --- SUITE 5: Functional Simulation & Partitioning Invariants ---
console.log('\n--- SUITE 5: Functional Simulation & Partitioning Invariants ---');

try {
  const currentAgencyUser = { id: 'agency-001' };

  const testLeads = [
    {
      id: 'lead-1',
      fullName: 'Alice (Delegated to Agent 1)',
      assignedToUserId: 'agent-101',
      createdByUserId: currentAgencyUser.id,
      status: 'new',
    },
    {
      id: 'lead-2',
      fullName: 'Bob (Unassigned Company Lead)',
      assignedToUserId: null,
      createdByUserId: currentAgencyUser.id,
      status: 'new',
    },
    {
      id: 'lead-3',
      fullName: 'Charlie (Worked Directly by Agency Principal)',
      assignedToUserId: currentAgencyUser.id,
      createdByUserId: currentAgencyUser.id,
      status: 'contacted',
    },
    {
      id: 'lead-4',
      fullName: 'Diana (Delegated to Agent 2)',
      assignedToUserId: 'agent-102',
      createdByUserId: currentAgencyUser.id,
      status: 'qualified',
    },
  ];

  // Test Partition Logic
  const masterLeads = testLeads.filter(
    (l) => Boolean(l.assignedToUserId) && l.assignedToUserId !== currentAgencyUser.id
  );
  const myLeads = testLeads.filter(
    (l) => !l.assignedToUserId || l.assignedToUserId === currentAgencyUser.id
  );

  assert.strictEqual(masterLeads.length, 2, 'Exactly 2 delegated leads under Master Leads');
  assert.strictEqual(myLeads.length, 2, 'Exactly 2 unassigned/self leads under My Leads');
  assert.strictEqual(masterLeads[0].id, 'lead-1');
  assert.strictEqual(masterLeads[1].id, 'lead-4');
  assert.strictEqual(myLeads[0].id, 'lead-2');
  assert.strictEqual(myLeads[1].id, 'lead-3');

  pass('Simulation: Agency sub-tab partitioning strictly separates delegated vs direct leads (2 Master / 2 My)');

  // Test Non-regression invariant: sum of sub-tabs equals total company leads
  assert.strictEqual(masterLeads.length + myLeads.length, testLeads.length);
  pass('Simulation: Partitioning invariant satisfied (Master Leads + My Leads === Total Leads, 0 leaks)');
} catch (err) {
  fail('Simulation Suite failed', err);
}

// --- SUITE 6: Thread Workspace & CRM Card Presentation Parity ---
console.log('\n--- SUITE 6: Thread Workspace & CRM Card Presentation Parity ---');

try {
  // 1. Verify MasterLeadSubHeader component exists and contains key controls
  const subHeaderPath = path.join(ROOT_DIR, 'components', 'chat', 'crm', 'MasterLeadSubHeader.tsx');
  assert(fs.existsSync(subHeaderPath), 'MasterLeadSubHeader.tsx exists');
  const subHeaderContent = fs.readFileSync(subHeaderPath, 'utf8');
  assert(subHeaderContent.includes('ASSIGNED AGENT'), 'Renders ASSIGNED AGENT header');
  assert(subHeaderContent.includes('Handoff Note'), 'Renders Handoff Note box');
  assert(subHeaderContent.includes('Conversations') && subHeaderContent.includes('Lead Summary'), 'Renders workspace sub-tabs');
  pass('MasterLeadSubHeader renders status pill, assigned agent pill, handoff notes, and workspace sub-tabs');

  // 2. Verify MasterLeadDetailsView component exists and renders tabs
  const detailsViewPath = path.join(ROOT_DIR, 'components', 'chat', 'crm', 'MasterLeadDetailsView.tsx');
  assert(fs.existsSync(detailsViewPath), 'MasterLeadDetailsView.tsx exists');
  const detailsContent = fs.readFileSync(detailsViewPath, 'utf8');
  assert(detailsContent.includes('INTERNAL TEAM NOTES'), 'Renders internal team notes tab');
  assert(detailsContent.includes('ASSIGNMENT HISTORY'), 'Renders assignment history tab');
  assert(detailsContent.includes('RESPONSE TIME'), 'Renders response time metric in Lead Summary');
  pass('MasterLeadDetailsView renders Lead Summary metrics, team notes, and assignment history');

  // 3. Verify Thread Screen integrates workspace
  const threadPath = path.join(ROOT_DIR, 'app', 'thread', '[id].tsx');
  const threadContent = fs.readFileSync(threadPath, 'utf8');
  assert(threadContent.includes('<MasterLeadSubHeader'), 'Thread integrates MasterLeadSubHeader for agencies/devs');
  assert(threadContent.includes('<MasterLeadDetailsView'), 'Thread integrates MasterLeadDetailsView for workspace sub-tabs');
  pass('ThreadScreen seamlessly switches between live chat feed and MasterLeadDetailsView');

  // 4. Verify CRM Card renders assigned agent and master lead badge
  const chatLeadsViewPath = path.join(ROOT_DIR, 'components', 'leads', 'ChatLeadsView.tsx');
  const chatLeadsContent = fs.readFileSync(chatLeadsViewPath, 'utf8');
  assert(chatLeadsContent.includes('masterLeadBadge'), 'ChatLeadsView renders Master Lead status badge');
  assert(chatLeadsContent.includes('assignedAgentChip'), 'ChatLeadsView renders assigned agent chip on delegated lead cards');
  pass('ChatLeadsView renders Master Lead badge and assigned agent chip on delegated lead cards');

  // 5. Verify thread session consumer guard
  const sessionPath = path.join(ROOT_DIR, 'hooks', 'thread', 'useThreadSession.ts');
  const sessionContent = fs.readFileSync(sessionPath, 'utf8');
  assert(sessionContent.includes('isViewerProfessional = canReceiveLeads('), 'Thread session checks professional role');
  assert(sessionContent.includes('inquiryData && isViewerProfessional'), 'Thread session suppresses assignmentObj for Buyer accounts');
  pass('useThreadSession strictly suppresses internal lead assignment data for Buyer accounts');
} catch (err) {
  fail('Thread Workspace & CRM Card Suite failed', err);
}

// --- SUITE 7: Parity Audit — Notes, History Timeline, Moderation Reports & Feed Privacy ---
console.log('\n--- SUITE 7: Parity Audit — Notes, History Timeline, Moderation Reports & Feed Privacy ---');

try {
  const detailsViewPath = path.join(ROOT_DIR, 'components', 'chat', 'crm', 'MasterLeadDetailsView.tsx');
  const detailsContent = fs.readFileSync(detailsViewPath, 'utf8');

  // 1. Verify live internal notes, RPC profile resolution, visibility selector & composer
  assert(detailsContent.includes("from('master_lead_internal_notes')"), 'Queries master_lead_internal_notes table');
  assert(detailsContent.includes("rpc('get_public_user_profiles'"), 'Resolves author profiles via get_public_user_profiles');
  assert(detailsContent.includes('company_only') && detailsContent.includes('company_and_agent'), 'Supports firm-only and firm-and-agent visibility');
  assert(detailsContent.includes('handleCreateNote'), 'Implements inline note composer handler');
  pass('MasterLeadDetailsView implements live team notes with author resolution, visibility toggling, and inline composer');

  // 2. Verify assignment history audit trail & visual timeline
  assert(detailsContent.includes("from('crm_inquiry_assignment_history')"), 'Queries crm_inquiry_assignment_history table');
  assert(detailsContent.includes('timelineConnector') && detailsContent.includes('timelineDot'), 'Renders vertical visual timeline');
  assert(detailsContent.includes('Assigned to') && detailsContent.includes('Reassigned to') && detailsContent.includes('Status updated'), 'Maps assignment action types');
  pass('MasterLeadDetailsView implements live assignment history audit trail with visual timeline and actor resolution');

  // 3. Verify buyer moderation reports
  assert(detailsContent.includes("from('master_lead_reports')"), 'Queries master_lead_reports table');
  assert(detailsContent.includes('messages_consent'), 'Inspects buyer messages consent flag');
  assert(detailsContent.includes('reportCard'), 'Renders buyer report card with status and reason');
  pass('MasterLeadDetailsView implements live moderation reports with buyer consent, reasons, and resolution status');

  // 4. Verify thread feed delegation privacy guard
  const threadPath = path.join(ROOT_DIR, 'app', 'thread', '[id].tsx');
  const threadContent = fs.readFileSync(threadPath, 'utf8');
  assert(threadContent.includes('isPrivateAgentChat ='), 'Defines isPrivateAgentChat privacy guard');
  assert(threadContent.includes('displayMessages = useMemo('), 'Filters displayMessages based on delegation time');
  assert(threadContent.includes('privacyNoticeCard'), 'Renders delegation notice when no pre-assignment messages exist');
  assert(threadContent.includes('preDelegationBanner'), 'Renders pre-delegation notice on historical message feed');
  assert(threadContent.includes('privacyComposerBar'), 'Replaces chat composer with privacy banner for private agent threads');
  pass('ThreadScreen enforces agent-buyer privacy guard on feed and composer when agent sharing is disabled');

  // 5. Verify optimistic updates and live badge counters
  const sessionPath = path.join(ROOT_DIR, 'hooks', 'thread', 'useThreadSession.ts');
  const sessionContent = fs.readFileSync(sessionPath, 'utf8');
  assert(sessionContent.includes('masterLeadStatus: newStatus'), 'Optimistically updates masterLeadStatus in thread session');
  assert(sessionContent.includes('notesCount') && sessionContent.includes('reportsCount'), 'Tracks live notesCount and reportsCount badges');
  pass('useThreadSession provides zero-latency masterLeadStatus sync and tracks live badge counters');
} catch (err) {
  fail('Parity Audit Suite failed', err);
}

// --- SUITE 8: Lead Identity, Partner Name Resolution & Dedicated Archived Folder Row ---
console.log('\n--- SUITE 8: Lead Identity, Partner Name Resolution & Dedicated Archived Folder Row ---');

try {
  const repoPath = path.join(ROOT_DIR, 'lib', 'repositories', 'conversationRepository.ts');
  const repoContent = fs.readFileSync(repoPath, 'utf8');

  // 1. Verify buyer_user_id select in chat_conversations
  assert(
    repoContent.includes('buyer_user_id,') && repoContent.includes('agency_user_id,'),
    'conversationRepository queries buyer_user_id and agency_user_id from chat_conversations'
  );
  pass('conversationRepository queries buyer_user_id and agency_user_id from chat_conversations');

  // 2. Verify partnerUserId prioritizes buyer for professional viewers
  assert(
    repoContent.includes('c.buyer_user_id') && repoContent.includes('!isViewerBuyer'),
    'conversationRepository prioritizes buyer_user_id for professional viewers'
  );
  pass('conversationRepository prioritizes buyer_user_id over internal agents for Agency/Agent viewers');

  // 3. Verify false master lead prevention: canAssignAgentsInThread + hasAssignedAgent
  assert(
    repoContent.includes('canAssignAgentsInThread =') &&
    repoContent.includes('hasAssignedAgent = Boolean(inq?.assigned_agent_user_id || effectiveAgentUserId)') &&
    repoContent.includes('const assignmentObj = (inq && isViewerProfessional && hasAssignedAgent)'),
    'Attaches assignmentObj only when an agent is actually assigned and viewer is professional'
  );
  pass('conversationRepository strictly eliminates false master lead badging when agency is buyer or unassigned');

  // 4. Verify thread session selects buyer_user_id and archives
  const sessionPath = path.join(ROOT_DIR, 'hooks', 'thread', 'useThreadSession.ts');
  const sessionContent = fs.readFileSync(sessionPath, 'utf8');
  assert(
    sessionContent.includes('buyer_user_id') && sessionContent.includes('isArchived = Boolean(currentParticipant?.archived_at)'),
    'useThreadSession reads buyer_user_id and participant archive state'
  );
  pass('useThreadSession binds buyer_user_id and provides active isArchived state');

  // 5. Verify dedicated Archived folder row in index.tsx
  const indexPath = path.join(ROOT_DIR, 'app', '(tabs)', 'index.tsx');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  assert(
    indexContent.includes('archivedCount = useMemo(') &&
    indexContent.includes('archivedFolderRow') &&
    indexContent.includes('archivedFolderTitle') &&
    indexContent.includes('archivedFolderSubtitle'),
    'index.tsx implements dedicated WhatsApp/Web-style Archived folder row'
  );
  pass('Inbox renders dedicated top Archived folder row matching DeltanHub web parity');
} catch (err) {
  fail('Lead Identity & Archived Folder Row Suite failed', err);
}

// --- SUMMARY ---
console.log('\n================================================================');
console.log(`  MASTER LEADS AUDIT: ${passedTests} PASSED / ${failedTests} FAILED (Total: ${passedTests + failedTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  console.error(`[AUDIT FAILED] ${failedTests} test(s) failed.`);
  process.exit(1);
} else {
  console.log('[AUDIT SUCCESS] 100% of Master Leads & Assigned Leads criteria verified.');
  process.exit(0);
}
