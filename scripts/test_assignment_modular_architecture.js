/**
 * DELCHAT LEAD ASSIGNMENT MODULAR ARCHITECTURE (OPTION C) VERIFICATION SUITE
 *
 * Verifies:
 * 1. Line count audits on all assignment files (target <= 200, ceiling < 250)
 * 2. Repository delegation (leadsRepository.fetchBrokerageAgents, assignAgentToLead, unassignAgentFromLead)
 * 3. Multi-tenant scoping (agency_agent_memberships, developer_agent_memberships)
 * 4. Component deconstruction and barrel export integrity
 * 5. Hook contracts in useAssignmentManager.ts
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('  DELCHAT ASSIGNMENT MODULAR ARCHITECTURE (OPTION C) VERIFICATION');
console.log('================================================================\n');

// SECTION 1: File Line Counts
console.log('--- SECTION 1: File Line Count Audits (Slim Presenter Target <= 200, Ceiling < 250) ---');
const assignmentFiles = [
  { path: 'components/chat/ManageAssignmentModal.tsx', max: 200, desc: 'ManageAssignmentModal.tsx' },
  { path: 'hooks/useAssignmentManager.ts', max: 200, desc: 'useAssignmentManager.ts' },
  { path: 'components/chat/assignment/AssignmentAgentCard.tsx', max: 200, desc: 'AssignmentAgentCard.tsx' },
  { path: 'components/chat/assignment/AssignmentColumnTabs.tsx', max: 200, desc: 'AssignmentColumnTabs.tsx' },
  { path: 'components/chat/assignment/AssignmentFooter.tsx', max: 200, desc: 'AssignmentFooter.tsx' },
  { path: 'components/chat/assignment/AssignmentSearchBar.tsx', max: 200, desc: 'AssignmentSearchBar.tsx' },
  { path: 'components/chat/assignment/index.ts', max: 50, desc: 'components/chat/assignment/index.ts' },
];

for (const f of assignmentFiles) {
  const fullPath = path.join(ROOT, f.path);
  assert(fs.existsSync(fullPath), `${f.desc} exists on disk`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  assert(
    lineCount <= f.max,
    `${f.desc} is modular (${lineCount} lines <= ${f.max} ceiling)`
  );
}

// SECTION 2: Architecture & Tenancy Invariants
console.log('\n--- SECTION 2: Clean Architecture & Tenancy Invariants Verification ---');
const modalCode = fs.readFileSync(path.join(ROOT, 'components/chat/ManageAssignmentModal.tsx'), 'utf8');
const hookCode = fs.readFileSync(path.join(ROOT, 'hooks/useAssignmentManager.ts'), 'utf8');

assert(
  modalCode.includes('agency_agent_memberships') || hookCode.includes('agency_agent_memberships'),
  'ManageAssignment retains agency_agent_memberships tenancy scoping'
);
assert(
  modalCode.includes('developer_agent_memberships') || hookCode.includes('developer_agent_memberships'),
  'ManageAssignment retains developer_agent_memberships tenancy scoping'
);
assert(
  modalCode.includes('leadsRepository.fetchBrokerageAgents') || hookCode.includes('leadsRepository.fetchBrokerageAgents'),
  'ManageAssignment delegates agent fetch to leadsRepository.fetchBrokerageAgents'
);
assert(
  modalCode.includes('leadsRepository.assignAgentToLead') || hookCode.includes('leadsRepository.assignAgentToLead'),
  'ManageAssignment delegates agent assignment to leadsRepository.assignAgentToLead'
);
assert(
  modalCode.includes('leadsRepository.unassignAgentFromLead') || hookCode.includes('leadsRepository.unassignAgentFromLead'),
  'ManageAssignment delegates lead unassignment to leadsRepository.unassignAgentFromLead'
);

// SECTION 3: Component Composition Audit
console.log('\n--- SECTION 3: Component Composition & Submodule Mounting Audit ---');
assert(
  modalCode.includes('<AssignmentSearchBar') && modalCode.includes('<AssignmentColumnTabs') &&
  modalCode.includes('<AssignmentAgentCard') && modalCode.includes('<AssignmentFooter'),
  'ManageAssignmentModal mounts all 4 specialized sub-components'
);
assert(
  modalCode.includes('useAssignmentManager('),
  'ManageAssignmentModal delegates all orchestration state to useAssignmentManager hook'
);

// SECTION 4: Barrel Export Verification
console.log('\n--- SECTION 4: Barrel Export Verification ---');
const indexCode = fs.readFileSync(path.join(ROOT, 'components/chat/assignment/index.ts'), 'utf8');
assert(
  indexCode.includes('AssignmentAgentCard') &&
  indexCode.includes('AssignmentColumnTabs') &&
  indexCode.includes('AssignmentFooter') &&
  indexCode.includes('AssignmentSearchBar'),
  'components/chat/assignment/index.ts cleanly exports all sub-components'
);

console.log('\n================================================================');
console.log(`  ASSIGNMENT MODULAR ARCHITECTURE (OPTION C): ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
