const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const MAX_LINES = 150;

const filesToCheck = [
  'lib/repositories/leadsRepository.ts',
  'lib/repositories/leads/types.ts',
  'lib/repositories/leads/brokerageAgents.ts',
  'lib/repositories/leads/agentCardNotifier.ts',
  'lib/repositories/leads/assignAgent.ts',
  'lib/repositories/leads/unassignAgent.ts',
  'lib/repositories/leads/internalNotesFetcher.ts',
  'lib/repositories/leads/internalNotesActions.ts',
  'lib/repositories/leads/leadCapture.ts',
  'lib/repositories/leads/index.ts',
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
  console.log('All leadsRepository modular architecture checks passed.');
  process.exit(0);
}
