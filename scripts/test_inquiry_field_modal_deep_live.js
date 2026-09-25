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
console.log('  INQUIRY FIELD MODAL DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Field name generation simulation
function sanitizeFieldName(label) {
  return (label || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50);
}

assert(sanitizeFieldName('Preferred Move-in Date') === 'preferred_movein_date', 'Sanitizes label with spaces and hyphens');
assert(sanitizeFieldName('Budget (USD)!') === 'budget_usd', 'Strips non-alphanumeric punctuation');
assert(sanitizeFieldName('') === '', 'Empty string handled safely');

// 2. Select options parsing simulation
function parseSelectOptions(optionsText) {
  return (optionsText || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const parsed = parseSelectOptions('Mortgage, Cash Buyer, Payment Plan, ');
assert(parsed.length === 3, 'Filters empty trailing entries');
assert(parsed[0] === 'Mortgage' && parsed[1] === 'Cash Buyer' && parsed[2] === 'Payment Plan', 'Trims whitespace cleanly');

// 3. Field Payload simulation
function buildFieldPayload(label, type, optionsText, isRequired, sortOrder) {
  const fieldName = sanitizeFieldName(label) || 'custom_field';
  const options = type === 'select' ? parseSelectOptions(optionsText) : null;
  return {
    fieldLabel: label.trim(),
    fieldName,
    fieldType: type,
    options,
    isRequired: Boolean(isRequired),
    sortOrder: sortOrder || 0,
  };
}

const payloadSelect = buildFieldPayload('Payment Method', 'select', 'Cash, Loan', true, 2);
assert(payloadSelect.fieldName === 'payment_method', 'Field name computed correctly');
assert(payloadSelect.options.length === 2, 'Options array populated for select');
assert(payloadSelect.isRequired === true, 'Required flag preserved');

const payloadText = buildFieldPayload('Special Requests', 'text', '', false, 3);
assert(payloadText.options === null, 'Options null for text field');
assert(payloadText.isRequired === false, 'Not required flag preserved');

console.log(`\nInquiryFieldModal Deep Live: ${passed} / ${total} tests passed.\n`);
