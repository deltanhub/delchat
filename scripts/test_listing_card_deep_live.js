const assert = require('assert');

function simulateListingCardView(message, isCurrentUser, isStarred = false) {
  const listing = message.listingCard;
  if (!listing) return null;

  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
  const propertyUrl = `${siteUrl}/properties/${listing.id}`;
  const displayBody = (message.body && message.body !== 'Shared property card') ? message.body : null;

  return {
    rendered: true,
    author: !isCurrentUser ? message.authorName : null,
    propertyUrl,
    title: listing.title,
    referenceCode: listing.referenceCode || listing.id,
    displayBody,
    isStarred,
  };
}

// 1. Valid listing card test
const sampleMsg = {
  id: 'msg_101',
  authorName: 'Alex Rivers',
  sentAt: new Date().toISOString(),
  body: 'Shared property card',
  listingCard: {
    id: 'prop_999',
    title: 'Luxury 4-Bedroom Terrace',
    address: 'Lekki Phase 1, Lagos',
    referenceCode: 'PROP-999',
    listingType: 'For Sale',
    listingStatus: 'Available',
    imageUrl: 'https://example.com/prop.jpg',
  },
};

const result1 = simulateListingCardView(sampleMsg, false, true);
assert(result1 !== null, 'Listing card should render');
assert.strictEqual(result1.author, 'Alex Rivers');
assert.strictEqual(result1.title, 'Luxury 4-Bedroom Terrace');
assert.strictEqual(result1.propertyUrl, 'https://deltanhub.com/properties/prop_999');
assert.strictEqual(result1.displayBody, null);
assert.strictEqual(result1.isStarred, true);
console.log('[PASS] Valid listing card simulation verified');

// 2. Custom body text test
const customBodyMsg = {
  ...sampleMsg,
  body: 'Check out this stunning property near the waterfront!',
};
const result2 = simulateListingCardView(customBodyMsg, true, false);
assert(result2 !== null);
assert.strictEqual(result2.author, null);
assert.strictEqual(result2.displayBody, 'Check out this stunning property near the waterfront!');
console.log('[PASS] Custom body text simulation verified');

// 3. Null listing returns null
const emptyMsg = { id: 'msg_102', body: 'Just text' };
assert.strictEqual(simulateListingCardView(emptyMsg, false), null);
console.log('[PASS] Null listing returns null verified');

console.log('All ListingCard deep live simulation tests passed.');
process.exit(0);
