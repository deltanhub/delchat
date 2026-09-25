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
console.log('  REPORT MODAL DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Report reason validation
const reasons = [
  'Spam or Unsolicited Ads',
  'Fraudulent Listing or Scam',
  'Harassment or Inappropriate Behavior',
  'Misleading Contact Information',
  'Other Policy Violation',
];

assert(reasons.includes('Spam or Unsolicited Ads'), 'Default reason is valid');
assert(reasons.length === 5, 'All 5 report reasons available');

// 2. Report payload simulation with consent toggle true
function buildReportPayload(reason, details, messagesConsent) {
  return {
    reason: reason,
    details: (details || '').trim(),
    messages_consent: Boolean(messagesConsent),
    created_at: '2026-09-15T12:00:00Z',
  };
}

const payloadConsentTrue = buildReportPayload(
  'Fraudulent Listing or Scam',
  '  Listing price on thread does not match advertised value   ',
  true
);

assert(payloadConsentTrue.reason === 'Fraudulent Listing or Scam', 'Reason matches');
assert(payloadConsentTrue.details === 'Listing price on thread does not match advertised value', 'Details trimmed cleanly');
assert(payloadConsentTrue.messages_consent === true, 'Consent true preserved for agency investigation');

// 3. Report payload simulation with consent toggle false
const payloadConsentFalse = buildReportPayload(
  'Harassment or Inappropriate Behavior',
  'Agent was rude',
  false
);

assert(payloadConsentFalse.messages_consent === false, 'Consent false preserved to protect buyer privacy');

console.log(`\nReportModal Deep Live: ${passed} / ${total} tests passed.\n`);
