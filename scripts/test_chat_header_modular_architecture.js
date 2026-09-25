/**
 * test_chat_header_modular_architecture.js
 * Verification of ChatHeader modularization, line limits, and contracts.
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
console.log('  CHAT HEADER MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every ChatHeader module is strictly <= 200 lines', () => {
  const files = [
    'components/chat/ChatHeader.tsx',
    'components/chat/header/index.ts',
    'components/chat/header/types.ts',
    'components/chat/header/styles.ts',
    'components/chat/header/ChatHeaderLeft.tsx',
    'components/chat/header/ChatHeaderRight.tsx',
    'components/chat/header/ChatHeaderDropdownMenu.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/chat/header/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/header/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export { ChatHeaderLeft } from './ChatHeaderLeft'"));
  assert(content.includes("export { ChatHeaderRight } from './ChatHeaderRight'"));
  assert(content.includes("export { ChatHeaderDropdownMenu } from './ChatHeaderDropdownMenu'"));
});

// 3. Presenter decoupling verification
test('ChatHeader delegates to modular sub-components', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/ChatHeader.tsx'), 'utf8');
  assert(content.includes('<ChatHeaderLeft'));
  assert(content.includes('<ChatHeaderRight'));
  assert(content.includes('<ChatHeaderDropdownMenu'));
});

// 4. Invariant compatibility verification (test_master_leads_architecture contract)
test('ChatHeader preserves canReportAgent, onReportAgent, and Report Agent contracts', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/ChatHeader.tsx'), 'utf8');
  assert(content.includes('canReportAgent'));
  assert(content.includes('onReportAgent'));
  assert(content.includes('Report Agent'));
});

// 5. Calling controls verification
test('ChatHeaderRight provides audio call, video call, and more options controls', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/header/ChatHeaderRight.tsx'), 'utf8');
  assert(content.includes('onAudioCall'));
  assert(content.includes('onVideoCall'));
  assert(content.includes('onOpenMenu'));
  assert(content.includes('canSendMessages'));
});

// 6. Dropdown menu comprehensive action items verification
test('ChatHeaderDropdownMenu provides complete menu actions', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/chat/header/ChatHeaderDropdownMenu.tsx'), 'utf8');
  assert(content.includes('onAddAsLead'));
  assert(content.includes('onToggleArchive'));
  assert(content.includes('onOpenChatInfo'));
  assert(content.includes('onViewStarred'));
  assert(content.includes('onOpenInternalNotes'));
  assert(content.includes('onToggleMute'));
  assert(content.includes('onManageAssignment'));
  assert(content.includes('onReportAgent'));
  assert(content.includes('onToggleBlock'));
});

console.log(`\nAll ${passed} Chat Header modular architecture tests passed successfully.\n`);
