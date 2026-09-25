const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

console.log('\n================================================================');
console.log('  BATCH 7: PRIMARY SCREENS & NAVIGATION MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

const BATCH_7_FILES = [
  'app/(tabs)/calls.tsx',
  'components/chat/recent_calls/CallsHeader.tsx',
  'components/chat/recent_calls/callsScreenStyles.ts',
  'app/(tabs)/leads.tsx',
  'components/leads/tabs/CrmSectionSwitcher.tsx',
  'components/leads/tabs/LeadsHeader.tsx',
  'components/leads/tabs/LeadsContentSwitcher.tsx',
  'app/(tabs)/_layout.tsx',
  'components/navigation/tabBarStyles.ts',
  'components/navigation/tabBarIcons.tsx',
  'components/navigation/TabBarItem.tsx',
  'components/navigation/index.ts',
  'app/auth.tsx',
  'components/auth/styles.ts',
  'components/auth/AuthHeader.tsx',
  'components/auth/AuthFooter.tsx',
  'components/auth/AuthForm.tsx',
  'components/auth/index.ts',
];

let passed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  [PASS] ${label}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${label}:`, err.message);
    process.exit(1);
  }
}

BATCH_7_FILES.forEach((relPath) => {
  check(`File exists and strictly <= 150 LOC: ${relPath}`, () => {
    const full = path.join(ROOT, relPath);
    assert(fs.existsSync(full), `File ${relPath} must exist`);
    const lines = fs.readFileSync(full, 'utf8').split('\n').length;
    assert(lines <= 150, `${relPath} has ${lines} lines, exceeding 150 lines limit!`);
  });
});

check('app/(tabs)/calls.tsx delegates to CallsHeader and renders RecentCallsList', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/(tabs)/calls.tsx'), 'utf8');
  assert(content.includes('<CallsHeader'), 'Must render CallsHeader');
  assert(content.includes('<RecentCallsList'), 'Must render RecentCallsList');
});

check('app/(tabs)/leads.tsx delegates to LeadsContentSwitcher and enforces role gates', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/(tabs)/leads.tsx'), 'utf8');
  assert(content.includes('<LeadsContentSwitcher'), 'Must render LeadsContentSwitcher');
  assert(content.includes('canReceiveLeads'), 'Must guard via canReceiveLeads');
  assert(content.includes('<LeadsRestrictedView'), 'Must render LeadsRestrictedView');
});

check('components/leads/tabs/LeadsHeader.tsx delegates to CrmSectionSwitcher', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/leads/tabs/LeadsHeader.tsx'), 'utf8');
  assert(content.includes('<CrmSectionSwitcher'), 'Must render CrmSectionSwitcher');
  assert(content.includes('<LeadsSubNav'), 'Must render LeadsSubNav');
});

check('app/(tabs)/_layout.tsx delegates to TabBarItem and enforces role-aware tabs', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/(tabs)/_layout.tsx'), 'utf8');
  assert(content.includes('<TabBarItem'), 'Must render TabBarItem');
  assert(content.includes("leads: isLandlord ? 'Inquiries' : 'CRM'"), 'Must customize leads tab label');
  assert(content.includes("state.routes.filter((route: any) => route.name !== 'leads')"), 'Must filter leads tab');
});

check('app/auth.tsx delegates to AuthHeader, AuthForm, and AuthFooter', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/auth.tsx'), 'utf8');
  assert(content.includes('<AuthHeader'), 'Must render AuthHeader');
  assert(content.includes('<AuthForm'), 'Must render AuthForm');
  assert(content.includes('<AuthFooter'), 'Must render AuthFooter');
});

console.log(`\nAll ${passed} Batch 7 modular architecture assertions passed!\n`);
