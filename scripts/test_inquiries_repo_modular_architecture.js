const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const MAX_LINES = 150;

const filesToCheck = [
  'lib/repositories/inquiriesRepository.ts',
  'lib/repositories/inquiries/types.ts',
  'lib/repositories/inquiries/inquiryResponses.ts',
  'lib/repositories/inquiries/inquiryTemplates.ts',
  'lib/repositories/inquiries/inquiryFields.ts',
  'lib/repositories/inquiries/index.ts',
];

let failed = false;

for (const relPath of filesToCheck) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] File missing: ${relPath}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  if (lineCount > MAX_LINES) {
    console.error(`[FAIL] ${relPath} exceeds line limit: ${lineCount} > ${MAX_LINES}`);
    failed = true;
  } else {
    console.log(`[PASS] ${relPath} (${lineCount} <= ${MAX_LINES} lines)`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('All inquiriesRepository modular architecture checks passed.');
  process.exit(0);
}
