/**
 * test_ask_ai_modular_architecture.js
 * Verification of AskAIModal modularization, line limits, and contracts.
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
console.log('  ASK AI MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every AskAI module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/AskAIModal.tsx',
    'components/chat/ask_ai/index.ts',
    'components/chat/ask_ai/types.ts',
    'components/chat/ask_ai/constants.ts',
    'components/chat/ask_ai/styles.ts',
    'components/chat/ask_ai/AskAIHeader.tsx',
    'components/chat/ask_ai/AskAIContextCard.tsx',
    'components/chat/ask_ai/AskAIQuickActions.tsx',
    'components/chat/ask_ai/AskAIResponseCard.tsx',
    'components/chat/ask_ai/useAskAI.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/ask_ai/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/ask_ai/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './constants'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { AskAIHeader } from './AskAIHeader'"));
  assert(content.includes("export { AskAIContextCard } from './AskAIContextCard'"));
  assert(content.includes("export { AskAIQuickActions } from './AskAIQuickActions'"));
  assert(content.includes("export { AskAIResponseCard } from './AskAIResponseCard'"));
  assert(content.includes("export { useAskAI } from './useAskAI'"));
});

// 3. Presenter decoupling verification
test('AskAIModal delegates to modular components and hook', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/AskAIModal.tsx'), 'utf8');
  assert(content.includes('<AskAIHeader'));
  assert(content.includes('<AskAIContextCard'));
  assert(content.includes('<AskAIQuickActions'));
  assert(content.includes('<AskAIResponseCard'));
  assert(content.includes('useAskAI'));
});

// 4. Live Deltan Intelligence API contract verification
test('AskAIModal and constants target live Deltan Intelligence endpoint', () => {
  const modalContent = fs.readFileSync(path.join(ROOT, 'components/chat/AskAIModal.tsx'), 'utf8');
  const constContent = fs.readFileSync(path.join(ROOT, 'components/chat/ask_ai/constants.ts'), 'utf8');
  assert(
    modalContent.includes('/api/deltan-intelligence/chat-mention') ||
    constContent.includes('/api/deltan-intelligence/chat-mention'),
    'Must target live Deltan Intelligence endpoint'
  );
  assert(
    !modalContent.includes('setTimeout(r, 600)') && !modalContent.includes('Based on the conversation so far'),
    'Eradicate fake artificial delays and canned templates'
  );
});

// 5. Quick actions contract verification
test('constants.ts defines 4 standard quick actions with specialized prompts', () => {
  const constContent = fs.readFileSync(path.join(ROOT, 'components/chat/ask_ai/constants.ts'), 'utf8');
  assert(constContent.includes("'reply'"));
  assert(constContent.includes("'explain'"));
  assert(constContent.includes("'summarize'"));
  assert(constContent.includes("'negotiate'"));
});

// 6. Response card contracts verification
test('AskAIResponseCard implements suggested answer header and insert button', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/ask_ai/AskAIResponseCard.tsx'), 'utf8');
  assert(content.includes('Suggested Answer'));
  assert(content.includes('Insert into Message'));
  assert(content.includes('onInsert'));
});

console.log(`\nAll ${passed} Ask AI modular architecture tests passed successfully.\n`);
