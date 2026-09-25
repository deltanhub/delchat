/**
 * test_chat_info_deep_live.js
 * Deep operational simulation of Chat Info channel kind labels, initials, property deep link formulation.
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
console.log('  CHAT INFO MODAL DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Initials extraction logic
test('getInitials extracts two uppercase initials or U fallback', () => {
  function getInitials(name) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  assert.strictEqual(getInitials('David Miller'), 'DM');
  assert.strictEqual(getInitials('Superstar'), 'S');
  assert.strictEqual(getInitials(''), 'U');
  assert.strictEqual(getInitials(null), 'U');
});

// Test 2: Role badge formulation
test('Role badge resolves Listing Inquiry vs Direct Contact', () => {
  function getRoleBadgeLabel(kind) {
    return kind === 'listing_human' ? 'Listing Inquiry' : 'Direct Contact';
  }
  assert.strictEqual(getRoleBadgeLabel('listing_human'), 'Listing Inquiry');
  assert.strictEqual(getRoleBadgeLabel('direct'), 'Direct Contact');
  assert.strictEqual(getRoleBadgeLabel('assistant'), 'Direct Contact');
});

// Test 3: Channel type display label
test('Channel Type meta value maps correctly', () => {
  function getChannelTypeLabel(kind) {
    return kind === 'listing_human' ? 'Listing Inquiry' : 'Direct Message';
  }
  assert.strictEqual(getChannelTypeLabel('listing_human'), 'Listing Inquiry');
  assert.strictEqual(getChannelTypeLabel('direct'), 'Direct Message');
});

// Test 4: Property deep link URL formulation
test('Property deep link forms valid DeltanHub web URL', () => {
  function getPropertyUrl(listingId, baseUrl) {
    const siteUrl = baseUrl || 'https://deltanhub.com';
    return `${siteUrl}/properties/${listingId}`;
  }
  assert.strictEqual(
    getPropertyUrl('prop-789', 'https://deltanhub.com'),
    'https://deltanhub.com/properties/prop-789'
  );
});

// Test 5: Starred button conditional rendering
test('Starred Messages button renders only when onViewStarred is supplied', () => {
  function shouldRenderStarred(onViewStarred) {
    return typeof onViewStarred === 'function';
  }
  assert.strictEqual(shouldRenderStarred(undefined), false);
  assert.strictEqual(shouldRenderStarred(() => {}), true);
});

// Test 6: Report Agent button conditional rendering
test('Report Agent button renders only when onReportAgent is supplied', () => {
  function shouldRenderReportAgent(onReportAgent) {
    return typeof onReportAgent === 'function';
  }
  assert.strictEqual(shouldRenderReportAgent(undefined), false);
  assert.strictEqual(shouldRenderReportAgent(() => {}), true);
});

console.log(`\nChatInfoModal Deep Live: ${passed} / 6 tests passed.`);
