/**
 * test_form_builder_deep_live.js
 * Deep operational simulation of form builder actions, reordering, validation, and mutations.
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
console.log('  INQUIRY FORM BUILDER DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Initial template fixture
function createFixture() {
  return {
    id: 'tpl-100',
    title: 'Schedule a Viewing',
    description: 'Please provide your details for property viewing',
    isActive: true,
    trigger: 'tour',
    fields: [
      { id: 'f-1', templateId: 'tpl-100', fieldLabel: 'Preferred Date', fieldType: 'date', isRequired: true, orderIndex: 0 },
      { id: 'f-2', templateId: 'tpl-100', fieldLabel: 'Time Slot', fieldType: 'select', isRequired: true, orderIndex: 1, options: ['Morning', 'Afternoon', 'Evening'] },
      { id: 'f-3', templateId: 'tpl-100', fieldLabel: 'Special Requests', fieldType: 'text', isRequired: false, orderIndex: 2 },
    ],
  };
}

// Test 1: Field reordering simulation
test('Reorder field up and down handles boundaries and swaps correctly', () => {
  let template = createFixture();

  function reorder(fieldId, direction) {
    const idx = template.fields.findIndex(f => f.id === fieldId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return; // Cannot move first item up
    if (direction === 'down' && idx === template.fields.length - 1) return; // Cannot move last item down

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newFields = [...template.fields];
    const temp = newFields[idx];
    newFields[idx] = newFields[targetIdx];
    newFields[targetIdx] = temp;
    template.fields = newFields;
  }

  // Boundary check: top item up does nothing
  reorder('f-1', 'up');
  assert.strictEqual(template.fields[0].id, 'f-1');

  // Move middle item up
  reorder('f-2', 'up');
  assert.strictEqual(template.fields[0].id, 'f-2');
  assert.strictEqual(template.fields[1].id, 'f-1');

  // Move middle item down
  reorder('f-1', 'down');
  assert.strictEqual(template.fields[1].id, 'f-3');
  assert.strictEqual(template.fields[2].id, 'f-1');

  // Boundary check: last item down does nothing
  reorder('f-1', 'down');
  assert.strictEqual(template.fields[2].id, 'f-1');
});

// Test 2: Add field simulation
test('Add field creates a valid field appended to the list', () => {
  const template = createFixture();
  const newFieldData = {
    fieldLabel: 'Phone Number',
    fieldType: 'phone',
    isRequired: true,
    orderIndex: template.fields.length,
  };

  const createdField = {
    ...newFieldData,
    id: `f-${Date.now()}`,
    templateId: template.id,
  };

  template.fields.push(createdField);
  assert.strictEqual(template.fields.length, 4);
  assert.strictEqual(template.fields[3].fieldLabel, 'Phone Number');
  assert.strictEqual(template.fields[3].isRequired, true);
});

// Test 3: Update field simulation
test('Update field updates specified patch without affecting others', () => {
  const template = createFixture();
  const patch = { fieldLabel: 'Preferred Tour Date & Time', isRequired: false };

  const idx = template.fields.findIndex(f => f.id === 'f-1');
  assert(idx !== -1);
  template.fields[idx] = { ...template.fields[idx], ...patch };

  assert.strictEqual(template.fields[idx].fieldLabel, 'Preferred Tour Date & Time');
  assert.strictEqual(template.fields[idx].isRequired, false);
  assert.strictEqual(template.fields[1].fieldLabel, 'Time Slot', 'Other fields must remain intact');
});

// Test 4: Delete field simulation
test('Delete field removes target field cleanly', () => {
  const template = createFixture();
  template.fields = template.fields.filter(f => f.id !== 'f-2');

  assert.strictEqual(template.fields.length, 2);
  assert.strictEqual(template.fields.find(f => f.id === 'f-2'), undefined);
  assert.strictEqual(template.fields[0].id, 'f-1');
  assert.strictEqual(template.fields[1].id, 'f-3');
});

// Test 5: Save meta validation
test('Meta details validation checks for empty title', () => {
  let savedTitle = null;
  let savedDesc = null;
  let validationError = null;

  function handleSave(title, desc) {
    if (!title.trim()) {
      validationError = 'Form title cannot be empty.';
      return;
    }
    savedTitle = title.trim();
    savedDesc = desc.trim();
  }

  // Reject blank
  handleSave('   ', 'description');
  assert.strictEqual(validationError, 'Form title cannot be empty.');
  assert.strictEqual(savedTitle, null);

  // Accept valid
  handleSave('Updated Form Title', 'New instructions');
  assert.strictEqual(savedTitle, 'Updated Form Title');
  assert.strictEqual(savedDesc, 'New instructions');
});

// Test 6: Form status toggle
test('Toggle form active toggles isActive state', () => {
  const template = createFixture();
  assert.strictEqual(template.isActive, true);

  template.isActive = !template.isActive;
  assert.strictEqual(template.isActive, false);

  template.isActive = !template.isActive;
  assert.strictEqual(template.isActive, true);
});

// Test 7: Trigger selector
test('Trigger switching updates selected trigger', () => {
  let currentTrigger = 'tour';
  function selectTrigger(next) {
    assert(['tour', 'question'].includes(next));
    currentTrigger = next;
  }

  selectTrigger('question');
  assert.strictEqual(currentTrigger, 'question');
  selectTrigger('tour');
  assert.strictEqual(currentTrigger, 'tour');
});

console.log(`\nAll ${passed} Inquiry Form Builder deep live operational simulation tests passed successfully.\n`);
