/**
 * test_leads_screen_modular_architecture.js
 * Verification of LeadsScreen modularization, line limits, and contracts.
 * Strictly <= 200 lines.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
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
console.log('  LEADS SCREEN MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every LeadsScreen module is strictly <= 200 lines', () => {
  const files = [
    'app/(tabs)/leads.tsx',
    'components/leads/tabs/index.ts',
    'components/leads/tabs/types.ts',
    'components/leads/tabs/styles.ts',
    'components/leads/tabs/LeadsRestrictedView.tsx',
    'components/leads/tabs/LeadsHeader.tsx',
    'components/leads/tabs/LeadsSubNav.tsx',
    'components/leads/tabs/LeadsModalsHost.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/leads/tabs/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/tabs/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { LeadsRestrictedView } from './LeadsRestrictedView'"));
  assert(content.includes("export { LeadsHeader } from './LeadsHeader'"));
  assert(content.includes("export { LeadsSubNav } from './LeadsSubNav'"));
  assert(content.includes("export { LeadsModalsHost } from './LeadsModalsHost'"));
});

// 3. Presenter decoupling verification
test('app/(tabs)/leads.tsx delegates to modular components and has no inline styles', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/(tabs)/leads.tsx'), 'utf8');
  assert(content.includes("from '../../components/leads/tabs'"));
  assert(content.includes('<LeadsHeader'));
  assert(content.includes('<LeadsRestrictedView'));
  assert(content.includes('<LeadsModalsHost'));
  assert(!content.includes('StyleSheet.create'), 'Presenter should not declare a separate inline stylesheet');
});

// 4. Role restriction contract verification
test('LeadsScreen enforces canReceiveLeads role gate', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/(tabs)/leads.tsx'), 'utf8');
  assert(content.includes('canReceiveLeads(prof.mainRole)'));
  assert(content.includes('canReceiveLeads(currentProfile.mainRole)'));
  assert(content.includes('<LeadsRestrictedView'));
});

// 5. Header and sub-navigation contracts
test('LeadsHeader correctly passes top and sub navigation handlers', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/tabs/LeadsHeader.tsx'), 'utf8');
  assert(content.includes('onSelectSection'));
  assert(content.includes('onSelectLeadsTab'));
  assert(content.includes('onSelectInquiriesTab'));
  assert(content.includes('<LeadsSubNav'));
});

console.log(`\nAll ${passed} Leads Screen modular architecture tests passed successfully.\n`);
