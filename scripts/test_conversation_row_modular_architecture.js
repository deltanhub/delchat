/**
 * Test Suite: ConversationRow Modular Architecture Verification
 * Validates file line limits (<= 200 lines), sub-module exports, and separation of concerns.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n--- Option 19: ConversationRow Modular Architecture Audit ---');

const ROOT_DIR = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT_DIR, 'components', 'chat', 'conversation_row');
const PRESENTER_FILE = path.join(ROOT_DIR, 'components', 'chat', 'ConversationRow.tsx');

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
  'timeHelpers.ts',
  'styles.ts',
  'ConversationAvatar.tsx',
  'ConversationLeadBadge.tsx',
  'ConversationRowDetails.tsx',
  'index.ts',
];

// Test 1: Presenter and all sub-modules exist
try {
  assert(fs.existsSync(PRESENTER_FILE), 'ConversationRow.tsx must exist');
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(MODULE_DIR, file);
    assert(fs.existsSync(fullPath), 'Sub-module must exist: ' + file);
  }
  pass('All Option 19 files and sub-modules exist');
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

// Test 3: Barrel file re-exports sub-components and helpers
try {
  const indexContent = fs.readFileSync(path.join(MODULE_DIR, 'index.ts'), 'utf8');
  assert(indexContent.includes("export * from './types'"), 'Exports types');
  assert(indexContent.includes("export * from './timeHelpers'"), 'Exports timeHelpers');
  assert(indexContent.includes("export * from './styles'"), 'Exports styles');
  assert(indexContent.includes("export * from './ConversationAvatar'"), 'Exports ConversationAvatar');
  assert(indexContent.includes("export * from './ConversationLeadBadge'"), 'Exports ConversationLeadBadge');
  assert(indexContent.includes("export * from './ConversationRowDetails'"), 'Exports ConversationRowDetails');
  pass('conversation_row index.ts properly barrel-exports all sub-modules');
} catch (e) {
  fail('Barrel exports check failed', e);
}

// Test 4: Presenter imports from modular directory and maintains required contracts
try {
  const presenterContent = fs.readFileSync(PRESENTER_FILE, 'utf8');
  assert(
    presenterContent.includes("from './conversation_row'"),
    'Presenter imports from modular directory'
  );
  assert(
    presenterContent.includes('export default function ConversationRow'),
    'Presenter exports default ConversationRow'
  );
  assert(
    presenterContent.includes('export type { ChatConversation, ChatParticipant }'),
    'Presenter re-exports ChatConversation & ChatParticipant types'
  );
  pass('Presenter adheres to clean architecture import contracts and default export');
} catch (e) {
  fail('Presenter architectural contract failed', e);
}

console.log('\nOption 19 Modular Architecture: ' + passedTests + ' / ' + totalTests + ' tests passed.');
if (passedTests !== totalTests) {
  process.exit(1);
}
