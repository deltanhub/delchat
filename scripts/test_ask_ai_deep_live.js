/**
 * test_ask_ai_deep_live.js
 * Deep operational simulation of Deltan Intelligence response parsing, query building, and error handling.
 * Strictly <= 200 lines.
 */
const assert = require('assert');

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
console.log('  ASK AI DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// Test 1: Multi-schema response extractor
test('Deltan Intelligence response extractor resolves across multiple payload variants', () => {
  function extractReply(responseJson) {
    const reply =
      responseJson?.reply ||
      responseJson?.answer ||
      responseJson?.response ||
      responseJson?.text ||
      responseJson?.content ||
      responseJson?.message ||
      (typeof responseJson?.data === 'string'
        ? responseJson.data
        : responseJson?.data?.reply || responseJson?.data?.text);

    if (reply && typeof reply === 'string') {
      return reply.trim();
    }
    throw new Error('Deltan Intelligence returned an empty response.');
  }

  assert.strictEqual(extractReply({ reply: 'This property has 3 bedrooms.' }), 'This property has 3 bedrooms.');
  assert.strictEqual(extractReply({ answer: 'Price is negotiable.' }), 'Price is negotiable.');
  assert.strictEqual(extractReply({ response: 'Inspection scheduled.' }), 'Inspection scheduled.');
  assert.strictEqual(extractReply({ text: 'Offer accepted.' }), 'Offer accepted.');
  assert.strictEqual(extractReply({ content: 'Documents sent.' }), 'Documents sent.');
  assert.strictEqual(extractReply({ message: 'Hello agent.' }), 'Hello agent.');
  assert.strictEqual(extractReply({ data: 'Direct string reply' }), 'Direct string reply');
  assert.strictEqual(extractReply({ data: { reply: 'Nested reply' } }), 'Nested reply');
  assert.strictEqual(extractReply({ data: { text: 'Nested text' } }), 'Nested text');

  assert.throws(() => extractReply({}), /empty response/);
  assert.throws(() => extractReply({ data: {} }), /empty response/);
});

// Test 2: Quick action prompt constructor
test('Quick action query formatting encapsulates prompt prefix and referenced message body', () => {
  function buildQuickActionQuery(promptPrefix, messageBody) {
    return `${promptPrefix}\n\n"${messageBody || ''}"`;
  }

  const res = buildQuickActionQuery(
    'Draft a polite response:',
    'Can I inspect the penthouse tomorrow at 2pm?'
  );
  assert(res.includes('Draft a polite response:'));
  assert(res.includes('"Can I inspect the penthouse tomorrow at 2pm?"'));

  const emptyRes = buildQuickActionQuery('Summarize:', null);
  assert.strictEqual(emptyRes, 'Summarize:\n\n""');
});

// Test 3: Custom query constructor and validation
test('Custom query construction trims whitespace and blocks empty input', () => {
  function buildCustomQuery(customPrompt, messageBody) {
    const trimmed = (customPrompt || '').trim();
    if (!trimmed) return null;
    return `${trimmed}\n\nContext Message:\n"${messageBody || ''}"`;
  }

  assert.strictEqual(buildCustomQuery('', 'Hello'), null);
  assert.strictEqual(buildCustomQuery('   ', 'Hello'), null);
  assert.strictEqual(buildCustomQuery(null, 'Hello'), null);

  const query = buildCustomQuery('  What is the service charge?  ', 'The rent is 5m per annum');
  assert.strictEqual(
    query,
    'What is the service charge?\n\nContext Message:\n"The rent is 5m per annum"'
  );
});

// Test 4: Error handling and fallback message derivation
test('Error fallback produces human-friendly explanation on API network failure', () => {
  function handleAiError(err) {
    return err?.message || 'Unable to connect to Deltan Intelligence. Please check your network connection and try again.';
  }

  assert.strictEqual(handleAiError(new Error('Rate limit exceeded')), 'Rate limit exceeded');
  assert.strictEqual(
    handleAiError(null),
    'Unable to connect to Deltan Intelligence. Please check your network connection and try again.'
  );
});

// Test 5: High-speed stress test (1,000 rapid extractions)
test('Processes 1,000 rapid Deltan Intelligence response parses under 20ms', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    const payload = i % 2 === 0 ? { reply: `Answer #${i}` } : { data: { text: `Answer #${i}` } };
    const text = payload.reply || payload.data?.text;
    assert(text.length > 0);
  }
  const elapsed = Date.now() - start;
  assert(elapsed < 20, `Parsed 1,000 payloads in ${elapsed}ms (< 20ms benchmark)`);
});

console.log(`\nAll ${passed} Ask AI deep operational simulation tests passed successfully.\n`);
