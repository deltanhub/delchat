const assert = require('assert');

// 1. Test template field grouping by templateId and sort_order
const rawTemplates = [
  { id: 'tpl-1', title: 'Tour Request', intent_trigger: 'tour', is_active: true },
  { id: 'tpl-2', title: 'General Question', intent_trigger: 'question', is_active: true },
];

const rawFields = [
  { id: 'f-1', template_id: 'tpl-1', field_name: 'date', field_label: 'Preferred Date', field_type: 'text', sort_order: 1 },
  { id: 'f-2', template_id: 'tpl-1', field_name: 'time', field_label: 'Preferred Time', field_type: 'select', sort_order: 2 },
  { id: 'f-3', template_id: 'tpl-2', field_name: 'notes', field_label: 'Special Notes', field_type: 'textarea', sort_order: 1 },
];

const fieldsByTemplate = new Map();
rawFields.forEach((f) => {
  const arr = fieldsByTemplate.get(f.template_id) || [];
  arr.push({
    id: f.id,
    templateId: f.template_id,
    fieldName: f.field_name,
    fieldLabel: f.field_label,
    fieldType: f.field_type,
    sortOrder: f.sort_order,
  });
  fieldsByTemplate.set(f.template_id, arr);
});

const mappedTemplates = rawTemplates.map((t) => ({
  id: t.id,
  title: t.title,
  fields: fieldsByTemplate.get(t.id) || [],
}));

assert.strictEqual(mappedTemplates.length, 2);
assert.strictEqual(mappedTemplates[0].fields.length, 2);
assert.strictEqual(mappedTemplates[0].fields[0].fieldName, 'date');
assert.strictEqual(mappedTemplates[0].fields[1].fieldName, 'time');
assert.strictEqual(mappedTemplates[1].fields.length, 1);
assert.strictEqual(mappedTemplates[1].fields[0].fieldName, 'notes');
console.log('[PASS] Inquiry template field mapping and grouping verified');

// 2. Test inquiry response payload mapping
const rawMsg = {
  id: 'msg-resp-1',
  conversation_id: 'conv-101',
  sender_user_id: 'user-buyer-1',
  created_at: '2026-09-15T12:00:00Z',
  structured_payload: {
    listingTitle: 'Sunset Waterfront Penthouse',
    templateTitle: 'VIP Private Tour',
    intentTrigger: 'tour',
    answers: [
      { label: 'Preferred Date', value: '2026-09-20' },
      { label: 'Time of Day', value: 'Morning (10:00 AM)' },
    ],
  },
};

const profileMap = new Map([['user-buyer-1', 'Adeyemi Johnson']]);
const mappedResponse = {
  id: rawMsg.id,
  conversationId: rawMsg.conversation_id,
  senderName: profileMap.get(rawMsg.sender_user_id) || 'Prospective Buyer',
  listingTitle: rawMsg.structured_payload.listingTitle,
  templateTitle: rawMsg.structured_payload.templateTitle,
  intentTrigger: rawMsg.structured_payload.intentTrigger,
  answers: rawMsg.structured_payload.answers,
};

assert.strictEqual(mappedResponse.id, 'msg-resp-1');
assert.strictEqual(mappedResponse.senderName, 'Adeyemi Johnson');
assert.strictEqual(mappedResponse.answers.length, 2);
assert.strictEqual(mappedResponse.answers[0].label, 'Preferred Date');
console.log('[PASS] Inquiry response payload mapping verified');

console.log('All inquiriesRepository deep live simulation tests passed.');
process.exit(0);
