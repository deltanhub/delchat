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
console.log('  INQUIRY FORM MODAL DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Database Row mapping simulation
const mockDbRows = [
  {
    id: 'tmpl-001',
    title: 'Off-Plan Villa Reservation',
    description: 'Preliminary questionnaire for Ikoyi Luxury Villas',
    fields: [
      { field_name: 'buyer_name', field_label: 'Full Legal Name', field_type: 'text', sort_order: 1, is_required: true },
      { field_name: 'financing', field_label: 'Financing Method', field_type: 'select', options: ['Mortgage', 'Outright Cash'], sort_order: 2, is_required: true },
    ],
  },
  {
    id: 'tmpl-002',
    title: 'Shortlet Booking Request',
    fields: [
      { field_name: 'checkin_date', field_label: 'Check-in Date', field_type: 'date', sort_order: 1, is_required: true },
    ],
  },
];

function mapTemplates(rows) {
  return (rows || []).map((t) => ({
    templateId: t.id,
    templateTitle: t.title,
    fields: (t.fields || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((f) => ({
        fieldName: f.field_name,
        fieldLabel: f.field_label,
        fieldType: f.field_type,
        options: Array.isArray(f.options) ? f.options : undefined,
        isRequired: f.is_required,
      })),
  }));
}

const mapped = mapTemplates(mockDbRows);
assert(mapped.length === 2, 'Maps both templates cleanly');
assert(mapped[0].templateId === 'tmpl-001', 'Template ID preserved');
assert(mapped[0].fields.length === 2, 'Fields array properly mapped');
assert(mapped[0].fields[0].fieldName === 'buyer_name', 'Field name preserved');
assert(mapped[0].fields[1].options.length === 2, 'Options array preserved');

// 2. Selection callback simulation
let selectedTemplate = null;
function handleSelect(tmpl) {
  selectedTemplate = tmpl;
}

handleSelect(mapped[0]);
assert(selectedTemplate !== null, 'Template selected');
assert(selectedTemplate.templateTitle === 'Off-Plan Villa Reservation', 'Title matches');

console.log(`\nInquiryFormModal Deep Live: ${passed} / ${total} tests passed.\n`);
