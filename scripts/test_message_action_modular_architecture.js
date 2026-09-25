/**
 * test_message_action_modular_architecture.js
 * Verification of MessageActionModal modularization, line limits, and contracts.
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
console.log('  MESSAGE ACTION MODAL MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every MessageAction module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/MessageActionModal.tsx',
    'components/chat/message_actions/index.ts',
    'components/chat/message_actions/types.ts',
    'components/chat/message_actions/constants.ts',
    'components/chat/message_actions/styles.ts',
    'components/chat/message_actions/QuickReactionPill.tsx',
    'components/chat/message_actions/ElevatedMessagePreview.tsx',
    'components/chat/message_actions/MessageActionMenuList.tsx',
    'components/chat/message_actions/useMessageActionHandlers.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/message_actions/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/message_actions/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './constants'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { QuickReactionPill } from './QuickReactionPill'"));
  assert(content.includes("export { ElevatedMessagePreview } from './ElevatedMessagePreview'"));
  assert(content.includes("export { MessageActionMenuList } from './MessageActionMenuList'"));
  assert(content.includes("export { useMessageActionHandlers } from './useMessageActionHandlers'"));
});

// 3. Presenter decoupling verification
test('MessageActionModal delegates to modular components and handler hook', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/MessageActionModal.tsx'), 'utf8');
  assert(content.includes('<QuickReactionPill'));
  assert(content.includes('<ElevatedMessagePreview'));
  assert(content.includes('<MessageActionMenuList'));
  assert(content.includes('useMessageActionHandlers'));
});

// 4. Quick reaction pill contract verification
test('QuickReactionPill renders emojis array and handles selection', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/message_actions/QuickReactionPill.tsx'), 'utf8');
  assert(content.includes('emojis.map'));
  assert(content.includes('onSelectEmoji'));
});

// 5. Action menu list contract verification
test('MessageActionMenuList implements 7 standard message actions', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/message_actions/MessageActionMenuList.tsx'), 'utf8');
  assert(content.includes('Reply'));
  assert(content.includes('Copy Text'));
  assert(content.includes('Forward'));
  assert(content.includes('Star message') || content.includes('Unstar message'));
  assert(content.includes('Ask Deltan AI'));
  assert(content.includes('Message Info'));
  assert(content.includes('Delete'));
});

console.log(`\nAll ${passed} Message Action modular architecture tests passed successfully.\n`);
