/**
 * test_action_modal_modular_architecture.js
 * Verification of ConversationActionModal modularization and line counts.
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
console.log('  CONVERSATION ACTION MODAL MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every Action Modal module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/ConversationActionModal.tsx',
    'components/chat/actions/index.ts',
    'components/chat/actions/types.ts',
    'components/chat/actions/styles.ts',
    'components/chat/actions/useConversationPeekMessages.ts',
    'components/chat/actions/ConversationPeekCard.tsx',
    'components/chat/actions/ConversationContextMenu.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/actions/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/actions/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export * from './useConversationPeekMessages'"));
  assert(content.includes("export * from './ConversationPeekCard'"));
  assert(content.includes("export * from './ConversationContextMenu'"));
});

// 3. Types verification
test('components/chat/actions/types.ts defines interfaces for peek and actions', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/actions/types.ts'), 'utf8');
  assert(content.includes('export interface PeekMessage'));
  assert(content.includes('export interface ConversationActionModalProps'));
  assert(content.includes('export interface ConversationPeekCardProps'));
  assert(content.includes('export interface ConversationContextMenuProps'));
});

// 4. Peek messages hook verification
test('useConversationPeekMessages handles keyset queries and cleared history', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/actions/useConversationPeekMessages.ts'), 'utf8');
  assert(content.includes('useConversationPeekMessages'));
  assert(content.includes("from('chat_messages')"));
  assert(content.includes('clearedHistoryAt'));
  assert(content.includes('limit(10)'));
  assert(content.includes('recentMessages'));
  assert(content.includes('loading'));
});

// 5. ConversationPeekCard verification
test('ConversationPeekCard renders interactive header, body feed, and mock input', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/actions/ConversationPeekCard.tsx'), 'utf8');
  assert(content.includes('getInitials'));
  assert(content.includes('peekHeaderTitle'));
  assert(content.includes('peekHeaderSub'));
  assert(content.includes('peekBody'));
  assert(content.includes('peekBubbleMe'));
  assert(content.includes('peekBubbleOther'));
  assert(content.includes('peekInputBar'));
});

// 6. ConversationContextMenu verification
test('ConversationContextMenu renders all 8 context actions with haptics', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/actions/ConversationContextMenu.tsx'), 'utf8');
  assert(content.includes('onTogglePin'));
  assert(content.includes('onMarkReadToggle'));
  assert(content.includes('onToggleArchive'));
  assert(content.includes('onToggleMute'));
  assert(content.includes('onToggleFavorite'));
  assert(content.includes('onBlockUser'));
  assert(content.includes('onClearConversation'));
  assert(content.includes('onDeleteConversation'));
  assert(content.includes('destructiveText'));
});

// 7. ConversationActionModal slim presenter verification
test('ConversationActionModal orchestrates peek card and context menu under 200 lines', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/ConversationActionModal.tsx'), 'utf8');
  assert(content.includes('useConversationPeekMessages'));
  assert(content.includes('ConversationPeekCard'));
  assert(content.includes('ConversationContextMenu'));
  assert(content.includes('handleOpenChat'));
  assert(content.includes('styles.backdrop'));
});

console.log(`\n================================================================`);
console.log(`  ALL ${passed} ACTION MODAL ARCHITECTURE CHECKS PASSED!`);
console.log(`================================================================\n`);
