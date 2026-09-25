const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST BATCH 2.4: CRM Details Hook Modular Architecture Audit ---');
const baseDir = path.resolve(__dirname, '..');

const filesToCheck = [
  { file: 'hooks/crm/useMasterLeadDetails.ts', max: 150 },
  { file: 'hooks/crm/lead_details/types.ts', max: 150 },
  { file: 'hooks/crm/lead_details/useLeadNotesState.ts', max: 150 },
  { file: 'hooks/crm/lead_details/useLeadHistoryReports.ts', max: 150 },
  { file: 'hooks/crm/lead_details/useLeadTimelineAudit.ts', max: 150 },
  { file: 'hooks/crm/lead_details/index.ts', max: 150 },
];

for (const { file, max } of filesToCheck) {
  const filePath = path.join(baseDir, file);
  assert(fs.existsSync(filePath), `File must exist: ${file}`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
  assert(lines <= max, `${file} exceeds ${max} lines (${lines} lines)`);
  console.log(`  [PASS] ${file} is strictly modular: ${lines} <= ${max} lines`);
}

const barrelPath = path.join(baseDir, 'hooks/crm/lead_details/index.ts');
const barrel = fs.readFileSync(barrelPath, 'utf8');
assert(barrel.includes("export * from './types'"), 'Barrel must export types');
assert(barrel.includes("export * from './useLeadNotesState'"), 'Barrel must export useLeadNotesState');
assert(barrel.includes("export * from './useLeadHistoryReports'"), 'Barrel must export useLeadHistoryReports');
assert(barrel.includes("export * from './useLeadTimelineAudit'"), 'Barrel must export useLeadTimelineAudit');
console.log('  [PASS] hooks/crm/lead_details/index.ts correctly exports all sub-modules');

const hookPath = path.join(baseDir, 'hooks/crm/useMasterLeadDetails.ts');
const hook = fs.readFileSync(hookPath, 'utf8');
assert(hook.includes("useLeadNotesState"), 'useMasterLeadDetails must delegate to useLeadNotesState');
assert(hook.includes("useLeadHistoryReports"), 'useMasterLeadDetails must delegate to useLeadHistoryReports');
assert(hook.includes("useLeadTimelineAudit"), 'useMasterLeadDetails must delegate to useLeadTimelineAudit');
console.log('  [PASS] hooks/crm/useMasterLeadDetails.ts delegates cleanly to modular sub-hooks');

console.log('--- ALL CRM DETAILS HOOK MODULAR ARCHITECTURE AUDITS PASSED ---');
