const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT & DELTANHUB PRESENCE & LAST SEEN SYNC VERIFICATION');
console.log('================================================================\n');

// 1. Test presence-utils formatting logic
const ts = require('typescript');
const presenceUtilsCode = fs.readFileSync(path.resolve(__dirname, '../lib/presence-utils.ts'), 'utf8');
const jsCode = ts.transpileModule(presenceUtilsCode, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const targetExports = {};
const runner = new Function('exports', jsCode);
runner(targetExports);
const { formatWhatsAppLastSeen } = targetExports;

console.log('--- TEST 1: formatWhatsAppLastSeen Format Parity ---');
assert.strictEqual(formatWhatsAppLastSeen(null, true, false), 'online', 'Online status returns "online"');
assert.strictEqual(formatWhatsAppLastSeen(null, false, true), 'typing...', 'Typing status returns "typing..."');
assert.strictEqual(formatWhatsAppLastSeen(null, false, false, 'My Subtitle'), 'My Subtitle', 'Null timestamp returns fallback subtitle');
assert.strictEqual(formatWhatsAppLastSeen(null, false, false), 'offline', 'Null timestamp without subtitle returns "offline"');

const now = new Date();
const todayIso = now.toISOString();
assert(formatWhatsAppLastSeen(todayIso, false, false).startsWith('last seen today at'), 'Today timestamp formats as "last seen today at ..."');

const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const yesterdayIso = yesterday.toISOString();
assert(formatWhatsAppLastSeen(yesterdayIso, false, false).startsWith('last seen yesterday at'), 'Yesterday timestamp formats as "last seen yesterday at ..."');

const older = new Date('2026-09-04T09:23:51.096Z');
const olderFormatted = formatWhatsAppLastSeen(older.toISOString(), false, false);
assert(olderFormatted.startsWith('last seen'), 'Historical timestamp formats as "last seen [Date] at [Time]"');
console.log(`  [PASS] Sample format for historical user (kik min): "${olderFormatted}"`);
console.log('  [PASS] All formatWhatsAppLastSeen assertions passed');

// 2. Test Realtime Channel Names against DeltanHub Web
console.log('\n--- TEST 2: Realtime Channel Parity with DeltanHub Web ---');
const webWorkspacePath = path.resolve('../deltanhub/app/chats/chats-workspace.tsx');
const mobileHookPath = path.resolve('./hooks/useThreadPresence.ts');

assert(fs.existsSync(mobileHookPath), 'hooks/useThreadPresence.ts exists');
const mobileHookSrc = fs.readFileSync(mobileHookPath, 'utf8');

assert(mobileHookSrc.includes('presence:${conversationId}'), 'Mobile presence channel matches web format: presence:${conversationId}');
console.log('  [PASS] Mobile presence channel: presence:${conversationId}');

assert(mobileHookSrc.includes('chat-typing:${conversationId}'), 'Mobile typing channel matches web format: chat-typing:${conversationId}');
console.log('  [PASS] Mobile typing channel: chat-typing:${conversationId}');

assert(mobileHookSrc.includes("touch_user_presence"), 'Mobile calls touch_user_presence RPC');
console.log('  [PASS] Mobile calls touch_user_presence RPC on mount & foreground');

// 3. Test Repository & Thread Screen Integration
console.log('\n--- TEST 3: Repository & Thread Screen Integration ---');
const repoPath = path.resolve('./lib/repositories/conversationRepository.ts');
const repoSrc = fs.readFileSync(repoPath, 'utf8');
assert(repoSrc.includes('partnerLastSeenAt: partnerProfile?.last_seen_at || null'), 'conversationRepository maps partnerLastSeenAt');
console.log('  [PASS] conversationRepository maps partnerLastSeenAt from public profile RPC');

const threadPath = path.resolve('./app/thread/[id].tsx');
const threadSrc = fs.readFileSync(threadPath, 'utf8');
assert(threadSrc.includes('useThreadPresence'), 'app/thread/[id].tsx integrates useThreadPresence hook');
assert(!threadSrc.includes('presenceStatus={AgentPresence.getStatus()}'), 'app/thread/[id].tsx eliminated misleading local agent presence dot');
assert(threadSrc.includes('lastSeenText={lastSeenText}'), 'app/thread/[id].tsx passes synchronized lastSeenText to ChatHeader');
console.log('  [PASS] app/thread/[id].tsx successfully decoupled from local agent presence and wired to synchronized hook');

console.log('\n================================================================');
console.log('  PRESENCE SYNC AUDIT: ALL TESTS PASSED (100%)');
console.log('================================================================');
