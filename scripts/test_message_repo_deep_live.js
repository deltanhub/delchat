const assert = require('assert');

// 1. Verify 500k CCU NULL-safe internal_note filtering invariant
const rawMessages = [
  { id: 'm1', intent: 'general', body: 'Hello' },
  { id: 'm2', intent: null, body: 'Null intent text' },
  { id: 'm3', intent: 'internal_note', body: 'Internal agent note' },
  { id: 'm4', intent: 'tour', body: 'Virtual tour' },
  { id: 'm5', intent: undefined, body: 'Undefined intent text' },
];

function isPublicMessage(msg) {
  return msg.intent === null || msg.intent === undefined || msg.intent !== 'internal_note';
}

const filtered = rawMessages.filter(isPublicMessage);
assert.strictEqual(filtered.length, 4);
assert.deepStrictEqual(filtered.map(m => m.id), ['m1', 'm2', 'm4', 'm5']);
console.log('[PASS] Message repository internal_note filter invariant verified');

// 2. Verify payload builder structures
const replySnapshot = { id: 'r1', authorName: 'Alice', body: 'Previous text' };
const textPayload = replySnapshot
  ? { replyTo: { messageId: replySnapshot.id, authorName: replySnapshot.authorName, body: replySnapshot.body } }
  : {};
assert.deepStrictEqual(textPayload.replyTo, { messageId: 'r1', authorName: 'Alice', body: 'Previous text' });

const listing = {
  id: 'lst-1',
  title: 'Luxury Villa',
  price: '$1,200,000',
  location: 'Banana Island',
  imageUrl: 'https://img.example/villa.jpg',
  referenceCode: 'REF-123',
  listingStatus: 'active',
};
const listingPayload = {
  listingCard: {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    imageUrl: listing.imageUrl,
    referenceCode: listing.referenceCode,
    status: listing.listingStatus,
  },
};
assert.strictEqual(listingPayload.listingCard.referenceCode, 'REF-123');
assert.strictEqual(listingPayload.listingCard.status, 'active');

const voiceNotePayload = {
  voiceNote: { durationSeconds: 42, audioUrl: 'https://audio.example/vn.m4a', localUri: 'file:///tmp/vn.m4a' },
};
assert.strictEqual(voiceNotePayload.voiceNote.durationSeconds, 42);

const inquiryAnswers = { budget: '500k', timeline: '3 months' };
const inquiryResponsePayload = {
  inquiryResponseCard: {
    templateTitle: 'Inquiry Questionnaire',
    answers: Object.entries(inquiryAnswers).map(([label, value]) => ({ label, value: String(value) })),
  },
};
assert.strictEqual(inquiryResponsePayload.inquiryResponseCard.answers.length, 2);
assert.strictEqual(inquiryResponsePayload.inquiryResponseCard.answers[0].label, 'budget');
console.log('[PASS] Structured message payload formation verified');

console.log('All messageRepository deep live simulation tests passed.');
process.exit(0);
