const assert = require('assert');

function validateAndSubmitForm(form, answers) {
  const fields = form.fields || [];
  for (const field of fields) {
    if (field.isRequired && (answers[field.id] === undefined || answers[field.id] === '')) {
      return { success: false, error: `Please complete the required field: ${field.fieldLabel}` };
    }
  }

  return {
    success: true,
    payload: {
      templateId: form.templateId,
      templateTitle: form.title,
      answers: fields.map((f) => ({
        label: f.fieldLabel,
        value: answers[f.id] !== undefined ? answers[f.id] : '',
      })),
    },
  };
}

const mockForm = {
  templateId: 'tmpl_001',
  title: 'Property Viewing Questionnaire',
  description: 'Please specify your availability and requirements',
  fields: [
    { id: 'f_name', fieldName: 'buyer_name', fieldLabel: 'Full Name', fieldType: 'text', isRequired: true },
    { id: 'f_phone', fieldName: 'phone', fieldLabel: 'Phone Number', fieldType: 'text', isRequired: true },
    { id: 'f_budget', fieldName: 'max_budget', fieldLabel: 'Maximum Budget', fieldType: 'number', isRequired: false },
    { id: 'f_mortgage', fieldName: 'pre_approved', fieldLabel: 'Mortgage Pre-approved', fieldType: 'boolean', isRequired: false },
  ],
};

// 1. Incomplete submission (missing required field)
const incompleteAnswers = { f_name: 'John Doe' };
const resFail = validateAndSubmitForm(mockForm, incompleteAnswers);
assert.strictEqual(resFail.success, false);
assert.strictEqual(resFail.error, 'Please complete the required field: Phone Number');
console.log('[PASS] Required field validation failure verified');

// 2. Complete submission
const validAnswers = {
  f_name: 'John Doe',
  f_phone: '+2348012345678',
  f_budget: '150000000',
  f_mortgage: true,
};
const resPass = validateAndSubmitForm(mockForm, validAnswers);
assert.strictEqual(resPass.success, true);
assert.strictEqual(resPass.payload.templateId, 'tmpl_001');
assert.strictEqual(resPass.payload.answers.length, 4);
assert.strictEqual(resPass.payload.answers[0].value, 'John Doe');
assert.strictEqual(resPass.payload.answers[3].value, true);
console.log('[PASS] Complete form submission payload verified');

console.log('All InquiryForm deep live simulation tests passed.');
process.exit(0);
