/**
 * Test Suite: ManualLeadsView Modular Architecture Verification
 * Validates file line limits (<= 200 lines), sub-module exports, and separation of concerns.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n--- Option 22: ManualLeadsView Modular Architecture Audit ---');

const ROOT_DIR = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT_DIR, 'components', 'leads', 'manual_leads');
const PRESENTER_FILE = path.join(ROOT_DIR, 'components', 'leads', 'ManualLeadsView.tsx');

let passedTests = 0;
let totalTests = 0;

function pass(name) {
  passedTests++;
  totalTests++;
  console.log('  [PASS] ' + name);
}

function fail(name, error) {
  totalTests++;
  console.error('  [FAIL] ' + name + ':', error && error.message ? error.message : error);
}

const REQUIRED_FILES = [
  'types.ts',
  'styles.ts',
  'ManualLeadMetricGrid.tsx',
  'ManualLeadActionBar.tsx',
  'ManualLeadFilterPills.tsx',
  'ManualLeadCard.tsx',
  'ManualLeadsEmptyState.tsx',
  'useManualLeadsFilter.ts',
  'index.ts',
];

// Test 1: Presenter and all sub-modules exist
try {
  assert(fs.existsSync(PRESENTER_FILE), 'ManualLeadsView.tsx must exist');
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(MODULE_DIR, file);
    assert(fs.existsSync(fullPath), 'Sub-module must exist: ' + file);
  }
  pass('All Option 22 files and sub-modules exist');
} catch (e) {
  fail('File existence check failed', e);
}

// Test 2: Line count strictly <= 200 lines for all files
try {
  const allFiles = [
    PRESENTER_FILE,
    ...REQUIRED_FILES.map((f) => path.join(MODULE_DIR, f)),
  ];

  for (const f of allFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/).length;
    assert(
      lines <= 200,
      path.basename(f) + ' exceeds 200 lines: ' + lines + ' lines found'
    );
  }
  pass('All files strictly satisfy <= 200 LOC rule');
} catch (e) {
  fail('Line count rule failed', e);
}

// Test 3: Barrel file re-exports sub-components and hook
try {
  const indexContent = fs.readFileSync(path.join(MODULE_DIR, 'index.ts'), 'utf8');
  assert(indexContent.includes("export * from './types'"), 'Exports types');
  assert(indexContent.includes("export * from './styles'"), 'Exports styles');
  assert(indexContent.includes("export * from './ManualLeadMetricGrid'"), 'Exports ManualLeadMetricGrid');
  assert(indexContent.includes("export * from './ManualLeadActionBar'"), 'Exports ManualLeadActionBar');
  assert(indexContent.includes("export * from './ManualLeadFilterPills'"), 'Exports ManualLeadFilterPills');
  assert(indexContent.includes("export * from './ManualLeadCard'"), 'Exports ManualLeadCard');
  assert(indexContent.includes("export * from './ManualLeadsEmptyState'"), 'Exports ManualLeadsEmptyState');
  assert(indexContent.includes("export * from './useManualLeadsFilter'"), 'Exports useManualLeadsFilter');
  pass('manual_leads index.ts properly barrel-exports all sub-modules');
} catch (e) {
  fail('Barrel exports check failed', e);
}

// Test 4: Presenter maintains required architectural invariants
try {
  const presenterContent = fs.readFileSync(PRESENTER_FILE, 'utf8');
  assert(
    presenterContent.includes("from './manual_leads'"),
    'Presenter imports from modular directory'
  );
  assert(
    presenterContent.includes('export default function ManualLeadsView'),
    'Presenter exports default ManualLeadsView'
  );
  assert(
    presenterContent.includes('export type { ManualLeadsViewProps }'),
    'Presenter re-exports ManualLeadsViewProps'
  );
  pass('Presenter adheres to clean architecture contracts and default export');
} catch (e) {
  fail('Presenter architectural contract failed', e);
}

console.log('\nOption 22 Modular Architecture: ' + passedTests + ' / ' + totalTests + ' tests passed.');
if (passedTests !== totalTests) {
  process.exit(1);
}
