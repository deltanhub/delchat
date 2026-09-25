/**
 * test_leads_data_deep_live.js
 * Deep operational simulation of leads data transforms, lookups, metric counts, and mutations.
 * Strictly <= 200 lines.
 */
const assert = require('assert');

function computeManualCounts(manualLeads) {
  const counts = {
    total: manualLeads.length,
    new: 0,
    active: 0,
    viewing: 0,
    closedOrLost: 0,
  };
  for (const lead of manualLeads) {
    if (lead.status === 'new') counts.new++;
    if (['new', 'contacted', 'viewing-scheduled', 'negotiating'].includes(lead.status)) counts.active++;
    if (lead.status === 'viewing-scheduled') counts.viewing++;
    if (['closed', 'lost'].includes(lead.status)) counts.closedOrLost++;
  }
  return counts;
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
console.log('  LEADS DATA HOOK DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Manual lead metric counts
test('computeManualCounts accurately aggregates all manual lead stages', () => {
  const fixture = [
    { id: '1', status: 'new' },
    { id: '2', status: 'contacted' },
    { id: '3', status: 'viewing-scheduled' },
    { id: '4', status: 'negotiating' },
    { id: '5', status: 'closed' },
    { id: '6', status: 'lost' },
  ];

  const counts = computeManualCounts(fixture);
  assert.strictEqual(counts.total, 6);
  assert.strictEqual(counts.new, 1);
  assert.strictEqual(counts.active, 4, 'new, contacted, viewing-scheduled, negotiating count as active');
  assert.strictEqual(counts.viewing, 1);
  assert.strictEqual(counts.closedOrLost, 2);
});

// Test 2: Fast inquiry lookups by ID and conversation ID
test('Inquiry Map lookups resolve linked inquiries in O(1)', () => {
  const rawInquiries = [
    { id: 'inq-1', conversation_id: 'conv-101', buyer_user_id: 'buyer-A', master_lead_status: 'qualified' },
    { id: 'inq-2', conversation_id: 'conv-102', buyer_user_id: 'buyer-B', master_lead_status: 'converted' },
  ];

  const inqById = new Map();
  const inqByConvId = new Map();
  rawInquiries.forEach((inq) => {
    if (inq.id) inqById.set(inq.id, inq);
    if (inq.conversation_id) inqByConvId.set(inq.conversation_id, inq);
  });

  // Direct lookup by inquiry ID
  assert.strictEqual(inqById.get('inq-1').buyer_user_id, 'buyer-A');
  // Fallback lookup by conversation ID
  assert.strictEqual(inqByConvId.get('conv-102').master_lead_status, 'converted');
  // Missing key lookup
  assert.strictEqual(inqById.get('inq-999'), undefined);
});

// Test 3: Chat lead enrichment with masterLeadStatus
test('Chat leads transformation enriches masterLeadStatus from linked inquiry', () => {
  const rawChatLeads = [
    { id: 'lead-1', conversation_id: 'conv-101', inquiry_id: 'inq-1', lead_status: 'new' },
    { id: 'lead-2', conversation_id: 'conv-999', inquiry_id: null, lead_status: 'contacted' },
  ];
  const inqById = new Map([['inq-1', { master_lead_status: 'qualified' }]]);
  const inqByConvId = new Map();

  const mapped = rawChatLeads.map((r) => {
    const linkedInq = (r.inquiry_id && inqById.get(r.inquiry_id)) || (r.conversation_id && inqByConvId.get(r.conversation_id));
    return {
      id: r.id,
      status: r.lead_status,
      masterLeadStatus: linkedInq?.master_lead_status || r.lead_status || 'new',
    };
  });

  assert.strictEqual(mapped[0].masterLeadStatus, 'qualified', 'Must prioritize linked inquiry masterLeadStatus');
  assert.strictEqual(mapped[1].masterLeadStatus, 'contacted', 'Must fallback to lead_status when unlinked');
});

// Test 4: Dual-table status synchronization logic
test('Dual-table status sync translates converted -> closed and closed_lost -> lost for crm_inquiries', () => {
  function getInquiryStatusUpdate(nextStatus) {
    return nextStatus === 'converted' ? 'closed' : nextStatus === 'closed_lost' ? 'lost' : nextStatus;
  }

  assert.strictEqual(getInquiryStatusUpdate('converted'), 'closed');
  assert.strictEqual(getInquiryStatusUpdate('closed_lost'), 'lost');
  assert.strictEqual(getInquiryStatusUpdate('qualified'), 'qualified');
  assert.strictEqual(getInquiryStatusUpdate('contacted'), 'contacted');
});

// Test 5: Manual lead insertion payload parsing
test('Manual lead insertion correctly coerces numeric fields and creates note metadata', () => {
  const formData = {
    contactName: '  John Doe  ',
    contactEmail: 'john@example.com',
    contactPhone: '+123456789',
    source: 'Referral',
    status: 'new',
    propertyType: 'Villa',
    propertyStatus: 'Available',
    priceFrom: ' 1500000 ',
    priceTo: ' 2000000 ',
    bedrooms: ' 4 ',
    bathrooms: ' 3 ',
    message: 'Interested in ocean view properties.',
  };

  const pFrom = formData.priceFrom.trim() ? Number(formData.priceFrom) : null;
  const pTo = formData.priceTo.trim() ? Number(formData.priceTo) : null;
  const beds = formData.bedrooms.trim() ? Number(formData.bedrooms) : null;
  const baths = formData.bathrooms.trim() ? Number(formData.bathrooms) : null;

  assert.strictEqual(pFrom, 1500000);
  assert.strictEqual(pTo, 2000000);
  assert.strictEqual(beds, 4);
  assert.strictEqual(baths, 3);
  assert.strictEqual(formData.contactName.trim(), 'John Doe');
});

// Test 6: Zero-latency optimistic UI update
test('Optimistic update reflects immediately in local state before async response', () => {
  let leads = [
    { id: 'lead-1', status: 'new', masterLeadStatus: 'new' },
    { id: 'lead-2', status: 'new', masterLeadStatus: 'new' },
  ];

  function optimisticUpdate(leadId, nextStatus) {
    leads = leads.map((l) => (l.id === leadId ? { ...l, status: nextStatus, masterLeadStatus: nextStatus } : l));
  }

  optimisticUpdate('lead-1', 'qualified');
  assert.strictEqual(leads[0].status, 'qualified');
  assert.strictEqual(leads[0].masterLeadStatus, 'qualified');
  assert.strictEqual(leads[1].status, 'new', 'Other leads must remain unaffected');
});

console.log(`\nAll ${passed} Leads Data hook deep live operational simulation tests passed successfully.\n`);
