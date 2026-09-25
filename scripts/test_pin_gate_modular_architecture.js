const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n================================================================');
console.log('  CHAT PIN GATE MODAL MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_LINES = 200;

const pinGateModules = [
  'components/chat/security/ChatPinGateModal.tsx',
  'components/chat/security/pin_gate/index.ts',
  'components/chat/security/pin_gate/types.ts',
  'components/chat/security/pin_gate/styles.ts',
  'components/chat/security/pin_gate/PinGateHeader.tsx',
  'components/chat/security/pin_gate/PinDotsRow.tsx',
  'components/chat/security/pin_gate/PinKeypadGrid.tsx',
  'components/chat/security/pin_gate/usePinGateAuth.ts',
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
check('Every ChatPinGate module is strictly <= 200 lines', () => {
  for (const mod of pinGateModules) {
    const fullPath = path.join(ROOT_DIR, mod);
    assert(fs.existsSync(fullPath), `Module ${mod} must exist`);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
    assert(lines <= MAX_LINES, `${mod} has ${lines} lines, exceeding limit of ${MAX_LINES}`);
  }
});

// 2. Barrel index export
check('components/chat/security/pin_gate/index.ts re-exports all sub-modules', () => {
  const indexPath = path.join(ROOT_DIR, 'components/chat/security/pin_gate/index.ts');
  const content = fs.readFileSync(indexPath, 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export * from './PinGateHeader'"));
  assert(content.includes("export * from './PinDotsRow'"));
  assert(content.includes("export * from './PinKeypadGrid'"));
  assert(content.includes("export * from './usePinGateAuth'"));
});

// 3. Types module contract
check('components/chat/security/pin_gate/types.ts defines props and biometry interfaces', () => {
  const typesPath = path.join(ROOT_DIR, 'components/chat/security/pin_gate/types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  assert(content.includes('ChatPinGateModalProps'));
  assert(content.includes('SetupStep'));
  assert(content.includes('BiometryInfo'));
  assert(content.includes('PinGateHeaderProps'));
  assert(content.includes('PinDotsRowProps'));
  assert(content.includes('PinKeypadGridProps'));
});

// 4. Header component
check('PinGateHeader renders dismiss button, shield icon, and dynamic headers', () => {
  const headerPath = path.join(ROOT_DIR, 'components/chat/security/pin_gate/PinGateHeader.tsx');
  const content = fs.readFileSync(headerPath, 'utf8');
  assert(content.includes('shieldBox'));
  assert(content.includes('lock-closed'));
  assert(content.includes('isSetupRequired'));
  assert(content.includes('setupStep'));
});

// 5. Dots Row component
check('PinDotsRow renders dynamic filled/unfilled indicators with shake transform', () => {
  const dotsPath = path.join(ROOT_DIR, 'components/chat/security/pin_gate/PinDotsRow.tsx');
  const content = fs.readFileSync(dotsPath, 'utf8');
  assert(content.includes('shakeAnim'));
  assert(content.includes('dots.map'));
  assert(content.includes('isFilled'));
});

// 6. Keypad Grid component
check('PinKeypadGrid handles digits, biometrics action, and backspace delete', () => {
  const keypadPath = path.join(ROOT_DIR, 'components/chat/security/pin_gate/PinKeypadGrid.tsx');
  const content = fs.readFileSync(keypadPath, 'utf8');
  assert(content.includes('onKeyPress'));
  assert(content.includes('onDelete'));
  assert(content.includes('onBiometricUnlock'));
  assert(content.includes('ScalePressable'));
});

// 7. Auth hook
check('usePinGateAuth coordinates verification, biometrics, shake, and setup steps', () => {
  const hookPath = path.join(ROOT_DIR, 'components/chat/security/pin_gate/usePinGateAuth.ts');
  const content = fs.readFileSync(hookPath, 'utf8');
  assert(content.includes('verifyChatPin'));
  assert(content.includes('setupChatPin'));
  assert(content.includes('authenticateWithBiometrics'));
  assert(content.includes('triggerShake'));
  assert(content.includes('handleKeyPress'));
  assert(content.includes('handleDelete'));
});

// 8. Slim Presenter
check('ChatPinGateModal is a slim presenter under 200 lines orchestrating sub-views', () => {
  const modalPath = path.join(ROOT_DIR, 'components/chat/security/ChatPinGateModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  const lines = content.split('\n').length;
  assert(lines <= MAX_LINES, `ChatPinGateModal is ${lines} lines`);
  assert(content.includes('PinGateHeader'));
  assert(content.includes('PinDotsRow'));
  assert(content.includes('PinKeypadGrid'));
  assert(content.includes('usePinGateAuth'));
});

console.log('\n================================================================');
if (failed > 0) {
  console.error(`  ${failed} PIN GATE ARCHITECTURE CHECKS FAILED!`);
  process.exit(1);
} else {
  console.log('  ALL 8 PIN GATE ARCHITECTURE CHECKS PASSED!');
  console.log('================================================================\n');
  process.exit(0);
}
