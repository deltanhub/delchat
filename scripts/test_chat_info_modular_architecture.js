/**
 * Test Suite: ChatInfoModal Modular Architecture Verification
 * Validates file line limits (<= 200 lines), sub-module exports, and separation of concerns.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n--- Option 21: ChatInfoModal Modular Architecture Audit ---');

const ROOT_DIR = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT_DIR, 'components', 'chat', 'chat_info');
const PRESENTER_FILE = path.join(ROOT_DIR, 'components', 'chat', 'ChatInfoModal.tsx');

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
  'ChatInfoProfileCard.tsx',
  'ChatInfoPropertySection.tsx',
  'ChatInfoDetailsSection.tsx',
  'ChatInfoActionButtons.tsx',
  'index.ts',
];

// Test 1: Presenter and all sub-modules exist
try {
  assert(fs.existsSync(PRESENTER_FILE), 'ChatInfoModal.tsx must exist');
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(MODULE_DIR, file);
    assert(fs.existsSync(fullPath), 'Sub-module must exist: ' + file);
  }
  pass('All Option 21 files and sub-modules exist');
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

// Test 3: Barrel file re-exports sub-components and styles
try {
  const indexContent = fs.readFileSync(path.join(MODULE_DIR, 'index.ts'), 'utf8');
  assert(indexContent.includes("export * from './types'"), 'Exports types');
  assert(indexContent.includes("export * from './styles'"), 'Exports styles');
  assert(indexContent.includes("export * from './ChatInfoProfileCard'"), 'Exports ChatInfoProfileCard');
  assert(indexContent.includes("export * from './ChatInfoPropertySection'"), 'Exports ChatInfoPropertySection');
  assert(indexContent.includes("export * from './ChatInfoDetailsSection'"), 'Exports ChatInfoDetailsSection');
  assert(indexContent.includes("export * from './ChatInfoActionButtons'"), 'Exports ChatInfoActionButtons');
  pass('chat_info index.ts properly barrel-exports all sub-modules');
} catch (e) {
  fail('Barrel exports check failed', e);
}

// Test 4: Presenter maintains required architectural invariants
try {
  const presenterContent = fs.readFileSync(PRESENTER_FILE, 'utf8');
  assert(
    presenterContent.includes("from './chat_info'"),
    'Presenter imports from modular directory'
  );
  assert(
    presenterContent.includes('export const ChatInfoModal'),
    'Presenter exports named ChatInfoModal'
  );
  assert(
    presenterContent.includes('export default ChatInfoModal'),
    'Presenter exports default ChatInfoModal'
  );
  assert(
    presenterContent.includes('onReportAgent'),
    'Presenter maintains onReportAgent invariant'
  );
  assert(
    presenterContent.includes('Report Agent to Management'),
    'Presenter maintains Report Agent to Management invariant'
  );
  pass('Presenter adheres to clean architecture contracts and required invariants');
} catch (e) {
  fail('Presenter architectural contract failed', e);
}

console.log('\nOption 21 Modular Architecture: ' + passedTests + ' / ' + totalTests + ' tests passed.');
if (passedTests !== totalTests) {
  process.exit(1);
}
