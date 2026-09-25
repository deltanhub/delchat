/**
 * Test Suite: RecentCallsList Modular Architecture Verification
 * Validates file line limits (<= 200 lines), sub-module exports, and separation of concerns.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n--- Option 20: RecentCallsList Modular Architecture Audit ---');

const ROOT_DIR = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT_DIR, 'components', 'chat', 'recent_calls');
const PRESENTER_FILE = path.join(ROOT_DIR, 'components', 'chat', 'RecentCallsList.tsx');

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
  'RecentCallsEmptyState.tsx',
  'RecentCallItem.tsx',
  'useRecentCallsData.ts',
  'index.ts',
];

// Test 1: Presenter and all sub-modules exist
try {
  assert(fs.existsSync(PRESENTER_FILE), 'RecentCallsList.tsx must exist');
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(MODULE_DIR, file);
    assert(fs.existsSync(fullPath), 'Sub-module must exist: ' + file);
  }
  pass('All Option 20 files and sub-modules exist');
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

// Test 3: Barrel file re-exports sub-components and hooks
try {
  const indexContent = fs.readFileSync(path.join(MODULE_DIR, 'index.ts'), 'utf8');
  assert(indexContent.includes("export * from './types'"), 'Exports types');
  assert(indexContent.includes("export * from './styles'"), 'Exports styles');
  assert(indexContent.includes("export * from './RecentCallsEmptyState'"), 'Exports RecentCallsEmptyState');
  assert(indexContent.includes("export * from './RecentCallItem'"), 'Exports RecentCallItem');
  assert(indexContent.includes("export * from './useRecentCallsData'"), 'Exports useRecentCallsData');
  pass('recent_calls index.ts properly barrel-exports all sub-modules');
} catch (e) {
  fail('Barrel exports check failed', e);
}

// Test 4: Presenter maintains required architectural invariants
try {
  const presenterContent = fs.readFileSync(PRESENTER_FILE, 'utf8');
  assert(
    presenterContent.includes("from './recent_calls'"),
    'Presenter imports from modular directory'
  );
  assert(
    presenterContent.includes('export default function RecentCallsList'),
    'Presenter exports default RecentCallsList'
  );
  assert(
    presenterContent.includes('callRepository.groupCallLogs'),
    'Presenter maintains callRepository.groupCallLogs invariant'
  );
  assert(
    presenterContent.includes('handleRedial'),
    'Presenter maintains handleRedial invariant'
  );
  assert(
    presenterContent.includes('filter: `user_id=eq.${currentUserId}`'),
    'Presenter maintains user_id CDC filter invariant'
  );
  assert(
    presenterContent.includes('const existing = supabase.getChannels().find('),
    'Presenter maintains deduplication invariant'
  );
  pass('Presenter adheres to clean architecture contracts and required invariants');
} catch (e) {
  fail('Presenter architectural contract failed', e);
}

console.log('\nOption 20 Modular Architecture: ' + passedTests + ' / ' + totalTests + ' tests passed.');
if (passedTests !== totalTests) {
  process.exit(1);
}
