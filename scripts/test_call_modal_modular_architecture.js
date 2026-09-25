const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n================================================================');
console.log('  CALL MODAL MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_LINES = 200;

const callModalModules = [
  'components/chat/CallModal.tsx',
  'components/chat/call/index.ts',
  'components/chat/call/types.ts',
  'components/chat/call/callModalStyles.ts',
  'components/chat/call/CallReconnectingBanner.tsx',
];

let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] ${desc}: ${err.message}`);
    failed++;
  }
}

// 1. Strict Line Count Verification (<= 200 lines per module)
check('Every CallModal module is strictly <= 200 lines', () => {
  for (const mod of callModalModules) {
    const fullPath = path.join(ROOT_DIR, mod);
    assert(fs.existsSync(fullPath), `Module ${mod} must exist`);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
    assert(lines <= MAX_LINES, `${mod} has ${lines} lines, exceeding limit of ${MAX_LINES}`);
  }
});

// 2. Barrel index export
check('components/chat/call/index.ts re-exports CallModal sub-modules', () => {
  const indexPath = path.join(ROOT_DIR, 'components/chat/call/index.ts');
  const content = fs.readFileSync(indexPath, 'utf8');
  assert(content.includes("export * from './CallHeader'"));
  assert(content.includes("export * from './CallAudioStage'"));
  assert(content.includes("export * from './CallVideoStage'"));
  assert(content.includes("export * from './CallPipWindow'"));
  assert(content.includes("export * from './CallControlsDock'"));
  assert(content.includes("export * from './CallReconnectingBanner'"));
  assert(content.includes("export * from './callModalStyles'"));
  assert(content.includes("export * from './types'"));
});

// 3. Types module contract
check('components/chat/call/types.ts defines CallPhase and CallModalProps', () => {
  const typesPath = path.join(ROOT_DIR, 'components/chat/call/types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  assert(content.includes('CallPhase'));
  assert(content.includes('CallModalProps'));
});

// 4. Styles module contract
check('components/chat/call/callModalStyles.ts defines backdrop, banner, and badges', () => {
  const stylesPath = path.join(ROOT_DIR, 'components/chat/call/callModalStyles.ts');
  const content = fs.readFileSync(stylesPath, 'utf8');
  assert(content.includes('backdrop'));
  assert(content.includes('reconnectingBanner'));
  assert(content.includes('partnerMuteBadge'));
  assert(content.includes('cameraPausedBadge'));
});

// 5. Reconnecting Banner component
check('CallReconnectingBanner renders icon and handover text', () => {
  const bannerPath = path.join(ROOT_DIR, 'components/chat/call/CallReconnectingBanner.tsx');
  const content = fs.readFileSync(bannerPath, 'utf8');
  assert(content.includes('swap-horizontal'));
  assert(content.includes('Reconnecting · Handover in progress'));
});

// 6. Slim Presenter
check('CallModal is a slim presenter under 200 lines coordinating stages', () => {
  const modalPath = path.join(ROOT_DIR, 'components/chat/CallModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  const lines = content.split('\n').length;
  assert(lines <= MAX_LINES, `CallModal is ${lines} lines`);
  assert(content.includes('proximityService'));
  assert(content.includes('isNearProximity'));
  assert(content.includes('partnerMuteBadge'));
  assert(content.includes('cameraPausedBadge'));
  assert(content.includes('CallReconnectingBanner'));
});

console.log('\n================================================================');
if (failed > 0) {
  console.error(`  ${failed} CALL MODAL ARCHITECTURE CHECKS FAILED!`);
  process.exit(1);
} else {
  console.log('  ALL 6 CALL MODAL ARCHITECTURE CHECKS PASSED!');
  console.log('================================================================\n');
  process.exit(0);
}
