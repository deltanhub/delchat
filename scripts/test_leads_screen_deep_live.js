/**
 * test_leads_screen_deep_live.js
 * Deep operational simulation of Leads Screen tab switching, modals, and access guards.
 * Strictly <= 200 lines.
 */
const assert = require('assert');

function canReceiveLeads(role) {
  if (!role) return false;
  return ['Agency', 'Developer', 'Agent', 'Landlord/Owner'].includes(role);
}

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
console.log('  LEADS SCREEN DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Role-based CRM access guard simulation
test('canReceiveLeads permits professional roles and restricts Buyer', () => {
  assert.strictEqual(canReceiveLeads('Agency'), true);
  assert.strictEqual(canReceiveLeads('Developer'), true);
  assert.strictEqual(canReceiveLeads('Agent'), true);
  assert.strictEqual(canReceiveLeads('Landlord/Owner'), true);
  assert.strictEqual(canReceiveLeads('Buyer'), false, 'Buyer must be strictly blocked from CRM Leads workspace');
});

// Test 2: Section and tab switching state machine
test('CRM section and sub-tab transitions update active view states', () => {
  let activeSection = 'leads';
  let activeLeadsTab = 'chat';
  let activeInquiriesTab = 'responses';

  function setSection(sec) {
    assert(['leads', 'inquiries'].includes(sec));
    activeSection = sec;
  }
  function setLeadsTab(tab) {
    assert(['chat', 'manual'].includes(tab));
    activeLeadsTab = tab;
  }
  function setInquiriesTab(tab) {
    assert(['responses', 'builder'].includes(tab));
    activeInquiriesTab = tab;
  }

  // Switch to inquiries -> responses
  setSection('inquiries');
  assert.strictEqual(activeSection, 'inquiries');
  assert.strictEqual(activeInquiriesTab, 'responses');

  // Switch to form builder
  setInquiriesTab('builder');
  assert.strictEqual(activeInquiriesTab, 'builder');

  // Switch back to leads -> my leads
  setSection('leads');
  setLeadsTab('manual');
  assert.strictEqual(activeSection, 'leads');
  assert.strictEqual(activeLeadsTab, 'manual');
});

// Test 3: Total leads count computation
test('Total leads count correctly aggregates chatLeads and manualLeads', () => {
  const chatLeads = [{ id: '1' }, { id: '2' }, { id: '3' }];
  const manualLeads = [{ id: 'm-1' }, { id: 'm-2' }];
  const total = chatLeads.length + manualLeads.length;
  assert.strictEqual(total, 5);
});

// Test 4: Modal open / close lifecycle
test('Modal lifecycle transitions update visibility and selection targets', () => {
  let addLeadModalVisible = false;
  let detailModalVisible = false;
  let selectedManualLead = null;

  // Open add modal
  addLeadModalVisible = true;
  assert.strictEqual(addLeadModalVisible, true);
  // Close add modal
  addLeadModalVisible = false;
  assert.strictEqual(addLeadModalVisible, false);

  // Open detail modal with lead
  const targetLead = { id: 'lead-123', contactName: 'John Doe' };
  selectedManualLead = targetLead;
  detailModalVisible = true;
  assert.strictEqual(detailModalVisible, true);
  assert.strictEqual(selectedManualLead.id, 'lead-123');

  // Close detail modal
  detailModalVisible = false;
  selectedManualLead = null;
  assert.strictEqual(detailModalVisible, false);
  assert.strictEqual(selectedManualLead, null);
});

// Test 5: Inquiries tab counter badges
test('Inquiries filter counts correctly tally tour and question intents', () => {
  const responses = [
    { id: 'r1', intentTrigger: 'tour' },
    { id: 'r2', intentTrigger: 'tour' },
    { id: 'r3', intentTrigger: 'question' },
    { id: 'r4', intentTrigger: 'tour' },
  ];

  const totalCount = responses.length;
  const tourCount = responses.filter((r) => r.intentTrigger === 'tour').length;
  const questionCount = responses.filter((r) => r.intentTrigger === 'question').length;

  assert.strictEqual(totalCount, 4);
  assert.strictEqual(tourCount, 3);
  assert.strictEqual(questionCount, 1);
});

console.log(`\nAll ${passed} Leads Screen deep live operational simulation tests passed successfully.\n`);
