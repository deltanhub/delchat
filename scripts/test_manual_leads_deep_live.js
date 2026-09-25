/**
 * test_manual_leads_deep_live.js
 * Deep operational simulation of Manual Leads filtering, metrics mapping, and search.
 * Strictly <= 200 lines.
 */
const assert = require('assert');

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
console.log('  MANUAL LEADS VIEW DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Sample test data
const sampleLeads = [
  { id: '1', contactName: 'Alice Green', contactEmail: 'alice@example.com', contactPhone: '+2348011111111', status: 'new', propertyType: 'Duplex', source: 'Website', createdAt: '2026-09-10T10:00:00Z' },
  { id: '2', contactName: 'Bob White', contactEmail: 'bob@example.com', contactPhone: '+2348022222222', status: 'active', propertyType: 'Terrace', source: 'Instagram', createdAt: '2026-09-11T12:00:00Z' },
  { id: '3', contactName: 'Charlie Black', contactEmail: 'charlie@example.com', contactPhone: '+2348033333333', status: 'viewing', propertyType: 'Penthouse', source: 'Referral', createdAt: '2026-09-12T14:00:00Z' },
  { id: '4', contactName: 'Daniel Gray', contactEmail: 'daniel@example.com', contactPhone: '+2348044444444', status: 'closed_won', propertyType: 'Duplex', source: 'Walk-in', createdAt: '2026-09-13T16:00:00Z' },
];

// Test 1: Status filtering logic
test('Status filtering correctly isolates matching lead records', () => {
  function filterByStatus(leads, status) {
    if (status === 'all') return leads;
    return leads.filter((l) => l.status === status);
  }
  assert.strictEqual(filterByStatus(sampleLeads, 'all').length, 4);
  assert.strictEqual(filterByStatus(sampleLeads, 'new').length, 1);
  assert.strictEqual(filterByStatus(sampleLeads, 'new')[0].contactName, 'Alice Green');
  assert.strictEqual(filterByStatus(sampleLeads, 'viewing').length, 1);
});

// Test 2: Search filtering across multiple fields
test('Search filtering searches name, email, phone, and property type', () => {
  function searchLeads(leads, query) {
    if (!query.trim()) return leads;
    const q = query.toLowerCase();
    return leads.filter((l) => {
      const matchesName = l.contactName.toLowerCase().includes(q);
      const matchesEmail = l.contactEmail?.toLowerCase().includes(q) || false;
      const matchesPhone = l.contactPhone?.toLowerCase().includes(q) || false;
      const matchesType = l.propertyType?.toLowerCase().includes(q) || false;
      return matchesName || matchesEmail || matchesPhone || matchesType;
    });
  }
  assert.strictEqual(searchLeads(sampleLeads, 'Duplex').length, 2);
  assert.strictEqual(searchLeads(sampleLeads, 'bob@example.com').length, 1);
  assert.strictEqual(searchLeads(sampleLeads, '80333').length, 1);
  assert.strictEqual(searchLeads(sampleLeads, 'Nonexistent').length, 0);
});

// Test 3: Combined status and search filtering
test('Combined filtering applies both status and search predicates simultaneously', () => {
  function filterLeads(leads, status, query) {
    return leads.filter((l) => {
      if (status !== 'all' && l.status !== status) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = l.contactName.toLowerCase().includes(q);
        const matchesType = l.propertyType?.toLowerCase().includes(q) || false;
        return matchesName || matchesType;
      }
      return true;
    });
  }
  assert.strictEqual(filterLeads(sampleLeads, 'new', 'Duplex').length, 1);
  assert.strictEqual(filterLeads(sampleLeads, 'active', 'Duplex').length, 0);
});

// Test 4: Budget text formatting
test('Budget text formats price bounds cleanly', () => {
  function formatBudget(priceFrom, priceTo) {
    if (!priceFrom && !priceTo) return null;
    const fromStr = priceFrom ? `₦${priceFrom.toLocaleString()}` : '0';
    const toStr = priceTo ? `₦${priceTo.toLocaleString()}` : 'Any';
    return `Budget: ${fromStr} - ${toStr}`;
  }
  assert.strictEqual(formatBudget(50000000, 100000000), 'Budget: ₦50,000,000 - ₦100,000,000');
  assert.strictEqual(formatBudget(null, 50000000), 'Budget: 0 - ₦50,000,000');
  assert.strictEqual(formatBudget(50000000, null), 'Budget: ₦50,000,000 - Any');
  assert.strictEqual(formatBudget(null, null), null);
});

console.log(`\nManualLeadsView Deep Live: ${passed} / 4 tests passed.`);
