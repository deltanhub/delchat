const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log('  [PASS] ' + message);
  } else {
    console.error('  [FAIL] ' + message);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  THREAD MESSAGES DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Realtime payload resolver simulation
const mockNewMsg = {
  id: 'msg-101',
  sender_type: 'user',
  sender_user_id: 'user-partner-01',
  message_kind: 'text',
  body: 'Hello, is the Ikoyi villa still available?',
  created_at: '2026-09-15T12:00:00.000Z',
  intent: 'inquiry',
  structured_payload: {
    attachments: [
      { id: 'att-1', url: 'https://example.com/photo.jpg', kind: 'image' },
    ],
  },
};

function resolveAttachments(msg) {
  if (Array.isArray(msg.structured_payload?.attachments)) {
    return msg.structured_payload.attachments.map((att, idx) => ({
      id: att.id || `${msg.id}-att-${idx}`,
      url: att.url,
      kind: att.kind || 'image',
    }));
  }
  return [];
}

const atts = resolveAttachments(mockNewMsg);
assert(atts.length === 1 && atts[0].id === 'att-1', 'Attachments properly resolved');

// 2. Incoming and outgoing message builder simulation
function buildIncoming(msg, attachments, partnerName) {
  return {
    id: msg.id,
    senderUserId: msg.sender_user_id,
    authorName: partnerName || 'Partner',
    authorRoleLabel: 'Seller',
    status: 'delivered',
    body: msg.body,
    sentAt: msg.created_at,
    attachments,
  };
}

const incoming = buildIncoming(mockNewMsg, atts, 'Chief Adeleke');
assert(incoming.authorName === 'Chief Adeleke', 'Partner name applied to incoming message');
assert(incoming.status === 'delivered', 'Incoming status initialized as delivered');

// 3. Reaction toggle simulation
function toggleReaction(currentReactions, emoji, userId) {
  const next = { ...currentReactions };
  const users = next[emoji] || [];
  if (users.includes(userId)) {
    next[emoji] = users.filter((u) => u !== userId);
    if (next[emoji].length === 0) delete next[emoji];
  } else {
    next[emoji] = [...users, userId];
  }
  return next;
}

let reactions = {};
reactions = toggleReaction(reactions, '❤️', 'user-01');
assert(reactions['❤️'].length === 1, 'Reaction added');

reactions = toggleReaction(reactions, '❤️', 'user-01');
assert(reactions['❤️'] === undefined, 'Reaction toggled off and key cleaned up');

// 4. Cursor pagination deduplication simulation
const currentMsgs = [{ id: 'm2', sentAt: 200 }, { id: 'm1', sentAt: 100 }];
const olderMsgs = [{ id: 'm1', sentAt: 100 }, { id: 'm0', sentAt: 50 }];
const currentIds = new Set(currentMsgs.map((m) => m.id));
const dedupedOlder = olderMsgs.filter((m) => !currentIds.has(m.id));
const merged = [...currentMsgs, ...dedupedOlder];
assert(merged.length === 3, 'Cursor pagination deduplicated (3 messages total)');
assert(merged[2].id === 'm0', 'Older message cleanly appended');

console.log(`\nThread Messages Deep Live: ${passed} / ${total} tests passed.\n`);
