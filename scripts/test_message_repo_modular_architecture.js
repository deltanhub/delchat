const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const MAX_LINES = 150;

const filesToCheck = [
  'lib/repositories/messageRepository.ts',
  'lib/repositories/message/types.ts',
  'lib/repositories/message/messageActions.ts',
  'lib/repositories/message/messageSenders.ts',
  'lib/repositories/message/richMessageSenders.ts',
  'lib/repositories/message/messageFetcher.ts',
  'lib/repositories/message/index.ts',
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
  console.log('All messageRepository modular architecture checks passed.');
  process.exit(0);
}
