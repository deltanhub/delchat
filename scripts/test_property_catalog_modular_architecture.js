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

console.log('\n--- Option 23: PropertyCatalogModal Modular Architecture Audit ---');

const files = [
  'components/chat/PropertyCatalogModal.tsx',
  'components/chat/property_catalog/index.ts',
  'components/chat/property_catalog/types.ts',
  'components/chat/property_catalog/styles.ts',
  'components/chat/property_catalog/formatters.ts',
  'components/chat/property_catalog/usePropertyCatalog.ts',
  'components/chat/property_catalog/PropertyCatalogHeader.tsx',
  'components/chat/property_catalog/PropertyCatalogSearchBar.tsx',
  'components/chat/property_catalog/PropertyCatalogCard.tsx',
  'components/chat/property_catalog/PropertyCatalogEmptyState.tsx',
];

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  assert(fs.existsSync(fullPath), f + ' exists');
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 200, f + ' strictly <= 200 LOC (' + lines + ' lines)');
}

const presenter = fs.readFileSync(path.join(ROOT, 'components/chat/PropertyCatalogModal.tsx'), 'utf8');
assert(presenter.includes('export default function PropertyCatalogModal'), 'PropertyCatalogModal default export present');
assert(presenter.includes('export type { SelectedListing, PropertyCatalogModalProps }') || presenter.includes('export type { SelectedListing'), 'SelectedListing exported');
assert(presenter.includes('get_my_catalog_listings'), 'References get_my_catalog_listings');
assert(presenter.includes('.rpc('), 'References .rpc(');

const hook = fs.readFileSync(path.join(ROOT, 'components/chat/property_catalog/usePropertyCatalog.ts'), 'utf8');
assert(hook.includes("supabase"), 'usePropertyCatalog imports supabase');
assert(hook.includes(".rpc('get_my_catalog_listings'"), 'usePropertyCatalog calls get_my_catalog_listings via RPC');

console.log(`\nPropertyCatalogModal Modular Architecture: ${passed} / ${total} tests passed.\n`);
