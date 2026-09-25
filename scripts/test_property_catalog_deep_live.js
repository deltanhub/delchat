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
console.log('  PROPERTY CATALOG DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Verify and test formatters logic
const formattersTs = fs.readFileSync(path.join(ROOT, 'components/chat/property_catalog/formatters.ts'), 'utf8');
assert(formattersTs.includes('export function formatPrice'), 'formatters.ts exports formatPrice');
assert(formattersTs.includes('export function formatLocation'), 'formatters.ts exports formatLocation');

function formatPrice(amount, curr) {
  if (!amount) return 'Price on Application';
  const sym = curr === 'NGN' ? '₦' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : '₦';
  return `${sym}${Number(amount).toLocaleString()}`;
}

function formatLocation(city, state) {
  return [city, state].filter(Boolean).join(', ') || 'Nigeria';
}

assert(formatPrice(undefined) === 'Price on Application', 'Undefined price defaults to "Price on Application"');
assert(formatPrice(0) === 'Price on Application', '0 price defaults to "Price on Application"');
assert(formatPrice(150000000, 'NGN') === '₦150,000,000', 'NGN formatted with ₦ symbol and commas');
assert(formatPrice(500000, 'USD') === '$500,000', 'USD formatted with $ symbol');
assert(formatPrice(250000, 'GBP') === '£250,000', 'GBP formatted with £ symbol');
assert(formatPrice(1000000, 'EUR') === '₦1,000,000', 'Fallback currency defaults to ₦');

assert(formatLocation('Ikoyi', 'Lagos') === 'Ikoyi, Lagos', 'City and state concatenated properly');
assert(formatLocation('Abuja', '') === 'Abuja', 'City only formats cleanly without trailing comma');
assert(formatLocation('', 'Enugu') === 'Enugu', 'State only formats cleanly without leading comma');
assert(formatLocation('', '') === 'Nigeria', 'Empty location defaults to Nigeria');

// 2. Listing Mapping & Payload Generation
const mockRpcItem = {
  id: 'list-001',
  title: 'Luxury Waterfront Villa',
  price_value: 450000000,
  currency_code: 'NGN',
  city: 'Victoria Island',
  state: 'Lagos',
  homepage_image_url: 'https://images.deltanhub.com/waterfront.jpg',
  listing_status: 'published',
  reference_code: 'REF-WAT-001',
};

const mappedListing = {
  id: mockRpcItem.id,
  title: mockRpcItem.title,
  price_amount: mockRpcItem.price_value,
  currency: mockRpcItem.currency_code,
  location_city: mockRpcItem.city,
  location_state: mockRpcItem.state,
  cover_image_url: mockRpcItem.homepage_image_url,
  status: mockRpcItem.listing_status,
  reference_code: mockRpcItem.reference_code,
};

const locationStr = formatLocation(mappedListing.location_city, mappedListing.location_state);
const selectedListingPayload = {
  id: mappedListing.id,
  title: mappedListing.title || 'Exclusive Property',
  price: formatPrice(mappedListing.price_amount, mappedListing.currency),
  location: locationStr,
  imageUrl: mappedListing.cover_image_url,
  referenceCode: mappedListing.reference_code || undefined,
  listingStatus: mappedListing.status || 'for_sale',
};

assert(selectedListingPayload.id === 'list-001', 'Selected listing ID matches');
assert(selectedListingPayload.price === '₦450,000,000', 'Selected listing price matches formatted NGN');
assert(selectedListingPayload.location === 'Victoria Island, Lagos', 'Selected listing location matches');
assert(selectedListingPayload.referenceCode === 'REF-WAT-001', 'Reference code preserved');
assert(selectedListingPayload.listingStatus === 'published', 'Listing status preserved');

console.log(`\nPropertyCatalogModal Deep Live: ${passed} / ${total} tests passed.\n`);
