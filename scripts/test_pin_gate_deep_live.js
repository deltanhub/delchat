const assert = require('assert');

console.log('\n================================================================');
console.log('  DELCHAT CHAT PIN GATE DEEP OPERATIONAL SIMULATION');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function runSuite(name, fn) {
  console.log(`--- SUITE: ${name} ---`);
  try {
    fn();
    console.log(`  [PASS] ${name}\n`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}\n`);
    failed++;
  }
}

// SUITE 1: Target Length Resolution
runSuite('PIN Target Length Resolution (4 vs 6 digits)', () => {
  function getTargetLength(propLen) {
    return propLen === 6 ? 6 : 4;
  }
  assert.strictEqual(getTargetLength(4), 4);
  assert.strictEqual(getTargetLength(6), 6);
  assert.strictEqual(getTargetLength(undefined), 4);
  assert.strictEqual(getTargetLength(8), 4);
});

// SUITE 2: Keypad Buffer & Deletion
runSuite('Keypad Input Buffer and Backspace Deletion', () => {
  let pin = '';
  const targetLength = 4;

  function handleKeyPress(digit) {
    if (pin.length >= targetLength) return;
    pin += digit;
  }

  function handleDelete() {
    if (pin.length === 0) return;
    pin = pin.slice(0, -1);
  }

  handleKeyPress('1');
  handleKeyPress('2');
  handleKeyPress('3');
  assert.strictEqual(pin, '123');

  handleDelete();
  assert.strictEqual(pin, '12');

  handleKeyPress('5');
  handleKeyPress('9');
  assert.strictEqual(pin, '1259');

  // Must not accept beyond targetLength
  handleKeyPress('7');
  assert.strictEqual(pin, '1259');
});

// SUITE 3: Setup Workflow & Mismatch Handling
runSuite('PIN Setup Workflow (Create -> Confirm -> Match/Mismatch)', () => {
  let step = 'create';
  let initialPin = '';
  let errorMsg = null;
  let unlocked = false;

  function handleSetupStep(enteredPin) {
    if (step === 'create') {
      initialPin = enteredPin;
      step = 'confirm';
    } else {
      if (enteredPin !== initialPin) {
        errorMsg = 'PINs do not match. Please try again.';
        step = 'create';
        initialPin = '';
        return;
      }
      unlocked = true;
    }
  }

  // Step 1: Create
  handleSetupStep('1234');
  assert.strictEqual(step, 'confirm');
  assert.strictEqual(initialPin, '1234');

  // Step 2: Mismatch
  handleSetupStep('9999');
  assert.strictEqual(step, 'create');
  assert.strictEqual(initialPin, '');
  assert.strictEqual(errorMsg, 'PINs do not match. Please try again.');
  assert.strictEqual(unlocked, false);

  // Step 3: Success run
  handleSetupStep('5678');
  assert.strictEqual(step, 'confirm');
  handleSetupStep('5678');
  assert.strictEqual(unlocked, true);
});

// SUITE 4: Biometric Authentication Dispatch
runSuite('Biometric Action Key & Fallback Handling', () => {
  function getActionKeyBehavior(biometryInfo, hasSavedPin, isSetupRequired) {
    if (biometryInfo.available && hasSavedPin && !isSetupRequired) {
      return { type: 'biometric', icon: biometryInfo.biometryType };
    }
    return { type: 'empty' };
  }

  const enabledFaceID = getActionKeyBehavior(
    { available: true, biometryType: 'FaceID' },
    true,
    false
  );
  assert.strictEqual(enabledFaceID.type, 'biometric');
  assert.strictEqual(enabledFaceID.icon, 'FaceID');

  const setupMode = getActionKeyBehavior(
    { available: true, biometryType: 'FaceID' },
    true,
    true
  );
  assert.strictEqual(setupMode.type, 'empty', 'Biometrics disabled during initial PIN setup');

  const noSavedPin = getActionKeyBehavior(
    { available: true, biometryType: 'TouchID' },
    false,
    false
  );
  assert.strictEqual(noSavedPin.type, 'empty', 'Biometrics disabled if no PIN saved');
});

// SUITE 5: Dot Fill Indicators Array
runSuite('Dot Fill States Array Generation', () => {
  function getDots(targetLength, currentPin) {
    return Array.from({ length: targetLength }, (_, i) => ({
      index: i,
      isFilled: currentPin.length > i,
    }));
  }

  const dots = getDots(4, '12');
  assert.strictEqual(dots.length, 4);
  assert.strictEqual(dots[0].isFilled, true);
  assert.strictEqual(dots[1].isFilled, true);
  assert.strictEqual(dots[2].isFilled, false);
  assert.strictEqual(dots[3].isFilled, false);
});

console.log('================================================================');
if (failed > 0) {
  console.error(`  ${failed} SUITES FAILED!`);
  process.exit(1);
} else {
  console.log(`  ALL ${passed} PIN GATE OPERATIONAL SUITES PASSED!`);
  console.log('================================================================\n');
  process.exit(0);
}
