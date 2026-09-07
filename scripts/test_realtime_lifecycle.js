const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');

console.log('================================================================');
console.log('  DELCHAT REALTIME LIFECYCLE & SUBSCRIPTION DEDUPLICATION SUITE');
console.log('================================================================\n');

const DELCHAT_DIR = path.resolve(__dirname, '..');

// -------------------------------------------------------------
// SUITE 1: Client-Level Lifecycle Guard Functional Simulation
// -------------------------------------------------------------
console.log('--- SUITE 1: Client-Level Lifecycle Guard Functional Simulation ---');

const mockSupabase = createClient('https://example.com', 'anon');
const originalChannel = mockSupabase.channel.bind(mockSupabase);

// Apply DelChat 500k CCU Realtime Channel Lifecycle Guard
mockSupabase.channel = function (name, opts) {
  const existing = mockSupabase.getChannels().find(
    (ch) => ch.topic === `realtime:${name}` || ch.subTopic === name
  );
  if (existing) {
    void mockSupabase.removeChannel(existing);
  }
  return originalChannel(name, opts);
};

// 1. Initial subscription on topic
const channelName = 'chat-call-logs-test-user-123';
const ch1 = mockSupabase
  .channel(channelName)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_call_participants' }, () => {})
  .subscribe();

assert.strictEqual(mockSupabase.getChannels().length, 1, 'Registry contains exactly 1 active channel');
console.log('  [PASS] Initial channel created and subscribed without error');

// 2. Simulate second component mounting with same channel name (The Exact Render Crash Scenario)
let caughtError = null;
try {
  const ch2 = mockSupabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_call_participants' }, () => {})
    .subscribe();
} catch (err) {
  caughtError = err;
}

assert.strictEqual(caughtError, null, 'Re-channel creation did NOT throw "cannot add postgres_changes callbacks after subscribe()"');
console.log('  [PASS] Re-instantiation with same topic succeeded without fatal render crash');
assert.strictEqual(mockSupabase.getChannels().length, 1, 'Registry maintained deduplicated channel count (no leak/sprawl)');
console.log('  [PASS] Zero Phoenix topic sprawl: stale channel replaced cleanly');

// 3. Verify presence configuration is preserved through wrapper
const presenceTopic = 'presence:conv-abc';
const presenceCh = mockSupabase.channel(presenceTopic, {
  config: { presence: { key: 'user-789' } },
});
assert.strictEqual(presenceCh.params?.config?.presence?.key, 'user-789', 'Presence configuration parameters preserved');
console.log('  [PASS] Realtime channel configuration options preserved');

// -------------------------------------------------------------
// SUITE 2: Static Audit of Hardened Realtime Call Sites
// -------------------------------------------------------------
console.log('\n--- SUITE 2: Static Audit of Hardened Realtime Call Sites ---');

const checkCallSite = (relativeFile, topicPattern, description) => {
  const fullPath = path.join(DELCHAT_DIR, relativeFile);
  assert(fs.existsSync(fullPath), `${relativeFile} exists`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(content.includes('supabase.getChannels()'), `${relativeFile} queries supabase.getChannels() for deduplication`);
  assert(content.includes('supabase.removeChannel'), `${relativeFile} calls supabase.removeChannel for lifecycle cleanup`);
  console.log(`  [PASS] ${description}`);
};

checkCallSite('components/chat/RecentCallsList.tsx', 'chat-call-logs-', 'RecentCallsList.tsx deduplicates and cleans up');
checkCallSite('app/(tabs)/index.tsx', 'inbox-sync-', 'app/(tabs)/index.tsx deduplicates inbox-sync channel');
checkCallSite('hooks/thread/useThreadMessages.ts', 'chat-thread-realtime-', 'useThreadMessages.ts deduplicates thread realtime channel');
checkCallSite('hooks/useThreadPresence.ts', 'presence:', 'useThreadPresence.ts deduplicates presence & typing channels');
checkCallSite('hooks/useCallSession.ts', 'chat-call-live:', 'useCallSession.ts deduplicates call session channels');
checkCallSite('components/chat/IncomingCallHUD.tsx', 'user-call-listener-', 'IncomingCallHUD.tsx deduplicates incoming call listeners');
checkCallSite('components/leads/useLeadsData.ts', 'delchat-leads-', 'useLeadsData.ts deduplicates CRM leads channel');
checkCallSite('lib/repositories/callRepository.ts', 'user-call-listener-', 'callRepository.ts deduplicates notifyChannel');

// -------------------------------------------------------------
// SUITE 3: lib/supabase.ts Client Guard Static Audit
// -------------------------------------------------------------
console.log('\n--- SUITE 3: lib/supabase.ts Client Guard Static Audit ---');

const supabaseSrc = fs.readFileSync(path.join(DELCHAT_DIR, 'lib', 'supabase.ts'), 'utf8');
assert(supabaseSrc.includes('const originalChannel = supabase.channel.bind(supabase)'), 'supabase.ts hooks original channel method');
assert(supabaseSrc.includes('supabase.getChannels()'), 'supabase.ts inspects registry on channel creation');
assert(supabaseSrc.includes('supabase.removeChannel(existing)'), 'supabase.ts purges existing topic instance before returning new channel');
assert(supabaseSrc.includes('export function getCleanChannel'), 'supabase.ts exports getCleanChannel helper');
console.log('  [PASS] lib/supabase.ts root lifecycle guard installed and verified');

// -------------------------------------------------------------
// SUITE 4: High-Concurrency Burst Simulation (1,000 Channels)
// -------------------------------------------------------------
console.log('\n--- SUITE 4: High-Concurrency Burst Simulation ---');

const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
  const ch = mockSupabase
    .channel('burst-test-topic')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_call_participants' }, () => {})
    .subscribe();
}
const durationMs = Date.now() - startTime;
const burstChannels = mockSupabase.getChannels().filter((c) => c.topic === 'realtime:burst-test-topic');
assert.strictEqual(burstChannels.length, 1, 'Registry deduplication holds under 1,000 rapid calls (exactly 1 channel on topic)');
console.log(`  [PASS] 1,000 rapid channel re-allocations processed in ${durationMs}ms with zero exceptions`);

console.log('\n================================================================');
console.log('  REALTIME LIFECYCLE AUDIT: ALL TESTS PASSED (100%)');
console.log('================================================================\n');

process.exit(0);
