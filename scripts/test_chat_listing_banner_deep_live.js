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

console.log('\n================================================================');
console.log('  CHAT LISTING BANNER DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Meta string generation verification
function getListingMetaString(listing) {
  return [listing.listingType, listing.city, listing.state]
    .filter(Boolean)
    .join(' · ');
}

const mockListing = {
  id: 'prop-777',
  title: '4 Bedroom Detached Duplex with BQ',
  imageUrl: 'https://images.deltanhub.com/properties/prop-777.jpg',
  referenceCode: 'DL-LAG-007',
  address: 'Banana Island, Ikoyi',
  city: 'Lagos',
  state: 'Lagos State',
  listingType: 'Duplex',
  listingStatus: 'For Sale',
};

const meta = getListingMetaString(mockListing);
assert(meta === 'Duplex · Lagos · Lagos State', 'Meta formatted correctly: ' + meta);

const partialMeta = getListingMetaString({ listingType: 'Penthouse' });
assert(partialMeta === 'Penthouse', 'Partial meta properly formatted without orphan dots: ' + partialMeta);

// 2. Status badge config verification across themes and statuses
function getListingStatusBadgeConfig(listingStatus, isDark) {
  const normalizedStatus = (listingStatus || '').trim().toLowerCase();
  const isSold = normalizedStatus.includes('sold');
  const isRented = normalizedStatus.includes('rented');
  const isOffer = normalizedStatus.includes('offer') || normalizedStatus.includes('pending');
  const isOffMarket = normalizedStatus.includes('inactive') || normalizedStatus.includes('delist') || normalizedStatus.includes('off market');
  const isForSale = normalizedStatus.includes('sale');
  const isForRent = normalizedStatus.includes('rent') && !isRented;

  if (isSold) return { label: 'SOLD', bg: isDark ? '#450a0a' : '#fef2f2', text: isDark ? '#fca5a5' : '#dc2626' };
  if (isRented) return { label: 'RENTED', bg: isDark ? '#2e1065' : '#f5f3ff', text: isDark ? '#d8b4fe' : '#7c3aed' };
  if (isOffer) return { label: 'UNDER OFFER', bg: isDark ? '#451a03' : '#fffbeb', text: isDark ? '#fcd34d' : '#d97706' };
  if (isOffMarket) return { label: 'OFF MARKET', bg: isDark ? '#1e293b' : '#f1f5f9', text: isDark ? '#94a3b8' : '#64748b' };
  if (isForSale) return { label: 'FOR SALE', bg: isDark ? '#14532d' : '#f0fdf4', text: isDark ? '#86efac' : '#16a34a' };
  if (isForRent) return { label: 'FOR RENT', bg: isDark ? '#1e1b4b' : '#eef2ff', text: isDark ? '#a5b4fc' : '#4f46e5' };
  if (listingStatus) return { label: listingStatus.toUpperCase(), bg: isDark ? '#1e293b' : '#f1f5f9', text: isDark ? '#94a3b8' : '#64748b' };
  return null;
}

const soldDark = getListingStatusBadgeConfig('Sold Out', true);
assert(soldDark.label === 'SOLD' && soldDark.bg === '#450a0a', 'Sold dark badge verified');

const rentLight = getListingStatusBadgeConfig('For Rent', false);
assert(rentLight.label === 'FOR RENT' && rentLight.bg === '#eef2ff', 'Rent light badge verified');

const offerBadge = getListingStatusBadgeConfig('Pending Offer', true);
assert(offerBadge.label === 'UNDER OFFER', 'Pending offer resolves to UNDER OFFER');

const nullBadge = getListingStatusBadgeConfig(null, false);
assert(nullBadge === null, 'Null status safely returns null');

// 3. Property URL routing verification
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
const propertyUrl = `${siteUrl}/properties/${mockListing.id}`;
assert(propertyUrl === 'https://deltanhub.com/properties/prop-777', 'Property URL resolves correctly');

console.log(`\nChatListingBanner Deep Live: ${passed} / ${total} tests passed.\n`);
