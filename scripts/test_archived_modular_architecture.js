/**
 * test_archived_modular_architecture.js
 * Verification of Archived Chats Screen modularization, line limits, and component contracts.
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
console.log('  ARCHIVED CHATS MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count verification
test('Every archived chats module is strictly <= 200 lines', () => {
  const files = [
    'app/archived.tsx',
    'components/archived/index.ts',
    'components/archived/types.ts',
    'components/archived/styles.ts',
    'components/archived/ArchivedHeader.tsx',
    'components/archived/ArchivedSearchBar.tsx',
    'components/archived/ArchivedEmptyState.tsx',
    'components/archived/ArchivedInfoBanner.tsx',
    'components/archived/ArchivedModalsHost.tsx',
    'components/archived/archivedDialogs.ts',
    'components/archived/useArchivedData.ts',
    'components/archived/useArchivedActions.ts',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/archived/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/archived/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export * from './ArchivedHeader'"));
  assert(content.includes("export * from './ArchivedSearchBar'"));
  assert(content.includes("export * from './ArchivedEmptyState'"));
  assert(content.includes("export * from './ArchivedInfoBanner'"));
  assert(content.includes("export * from './ArchivedModalsHost'"));
  assert(content.includes("export * from './archivedDialogs'"));
  assert(content.includes("export * from './useArchivedData'"));
  assert(content.includes("export * from './useArchivedActions'"));
});

// 3. Types verification
test('components/archived/types.ts defines interfaces for components and modals', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/archived/types.ts'), 'utf8');
  assert(content.includes('export interface ArchivedHeaderProps'));
  assert(content.includes('export interface ArchivedSearchBarProps'));
  assert(content.includes('export interface ArchivedEmptyStateProps'));
  assert(content.includes('export interface ArchivedInfoBannerProps'));
  assert(content.includes('export interface ArchivedModalsHostProps'));
});

// 4. Header & Search contracts
test('ArchivedHeader and ArchivedSearchBar satisfy UX contracts', () => {
  const headerContent = fs.readFileSync(path.join(ROOT, 'components/archived/ArchivedHeader.tsx'), 'utf8');
  assert(headerContent.includes('ScalePressable'));
  assert(headerContent.includes('chevron-back'));
  assert(headerContent.includes('Archived Chats'));

  const searchContent = fs.readFileSync(path.join(ROOT, 'components/archived/ArchivedSearchBar.tsx'), 'utf8');
  assert(searchContent.includes('Search archived chats...'));
  assert(searchContent.includes('close-circle'));
  assert(searchContent.includes('onChangeText={setSearchQuery}'));
});

// 5. EmptyState & InfoBanner contracts
test('ArchivedEmptyState and ArchivedInfoBanner satisfy informative status contracts', () => {
  const emptyContent = fs.readFileSync(path.join(ROOT, 'components/archived/ArchivedEmptyState.tsx'), 'utf8');
  assert(emptyContent.includes('archive-outline'));
  assert(emptyContent.includes('No Archived Chats'));

  const bannerContent = fs.readFileSync(path.join(ROOT, 'components/archived/ArchivedInfoBanner.tsx'), 'utf8');
  assert(bannerContent.includes('These chats stay archived when new messages are received.'));
});

// 6. Modals host contract
test('ArchivedModalsHost encapsulates Action Modal and Mute Duration Picker', () => {
  const modalsContent = fs.readFileSync(path.join(ROOT, 'components/archived/ArchivedModalsHost.tsx'), 'utf8');
  assert(modalsContent.includes('ConversationActionModal'));
  assert(modalsContent.includes('MuteDurationModal'));
  assert(modalsContent.includes('onSelectMuteDuration'));
});

// 7. Hooks contracts
test('useArchivedData and useArchivedActions isolate state and actions', () => {
  const dataContent = fs.readFileSync(path.join(ROOT, 'components/archived/useArchivedData.ts'), 'utf8');
  assert(dataContent.includes('OfflineEngine.getConversations'));
  assert(dataContent.includes('conversationRepository.fetchInboxConversations'));
  assert(dataContent.includes('c.isArchived'));

  const actionsContent = fs.readFileSync(path.join(ROOT, 'components/archived/useArchivedActions.ts'), 'utf8');
  assert(actionsContent.includes('handleToggleArchive'));
  assert(actionsContent.includes('handleToggleMute'));
  assert(actionsContent.includes('handleMarkReadToggle'));
  assert(actionsContent.includes('handleTogglePin'));
  assert(actionsContent.includes('handleDeleteConversation'));
});

// 8. Presenter screen verification
test('app/archived.tsx is a slim presenter orchestrating hooks and sub-views under 200 lines', () => {
  const screenContent = fs.readFileSync(path.join(ROOT, 'app/archived.tsx'), 'utf8');
  assert(screenContent.includes('useArchivedData'));
  assert(screenContent.includes('useArchivedActions'));
  assert(screenContent.includes('ArchivedHeader'));
  assert(screenContent.includes('ArchivedSearchBar'));
  assert(screenContent.includes('ArchivedModalsHost'));
  assert(screenContent.includes('FlatList'));
});

console.log(`\n================================================================`);
console.log(`  ALL ${passed} ARCHIVED CHATS ARCHITECTURE CHECKS PASSED!`);
console.log(`================================================================\n`);
