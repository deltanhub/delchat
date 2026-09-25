/**
 * test_settings_modular_architecture.js
 * Verification of Settings Screen modularization, line counts, and component contracts.
 * Strictly <= 200 lines.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  SETTINGS MODULAR ARCHITECTURE AUDIT');
console.log('================================================================\n');

// 1. Line count constraint verification
test('Every settings file is strictly <= 200 lines', () => {
  const files = [
    'app/(tabs)/settings.tsx',
    'components/settings/index.ts',
    'components/settings/types.ts',
    'components/settings/styles.ts',
    'components/settings/SettingsHeader.tsx',
    'components/settings/SettingsProfileCard.tsx',
    'components/settings/SettingsPresenceCard.tsx',
    'components/settings/SettingsSecurityCard.tsx',
    'components/settings/SettingsAccountCard.tsx',
  ];
  for (const f of files) {
    const p = path.join(ROOT, f);
    assert(fs.existsSync(p), `File must exist: ${f}`);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    assert(lines <= 200, `${f} has ${lines} lines, exceeding 200 limit!`);
  }
});

// 2. Barrel exports verification
test('components/settings/index.ts re-exports all sub-modules', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/settings/index.ts'), 'utf8');
  assert(content.includes("export * from './types'"));
  assert(content.includes("export * from './styles'"));
  assert(content.includes("export * from './SettingsHeader'"));
  assert(content.includes("export * from './SettingsProfileCard'"));
  assert(content.includes("export * from './SettingsPresenceCard'"));
  assert(content.includes("export * from './SettingsSecurityCard'"));
  assert(content.includes("export * from './SettingsAccountCard'"));
});

// 3. Types contract verification
test('components/settings/types.ts defines valid interfaces and timeout options', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/settings/types.ts'), 'utf8');
  assert(content.includes('export interface TimeoutOption'));
  assert(content.includes('export const TIMEOUT_OPTIONS'));
  assert(content.includes('export interface SettingsHeaderProps'));
  assert(content.includes('export interface SettingsProfileCardProps'));
  assert(content.includes('export interface SettingsPresenceCardProps'));
  assert(content.includes('export interface SettingsSecurityCardProps'));
  assert(content.includes('export interface SettingsAccountCardProps'));
  assert(content.includes('roleBadgeStyle?: any'));
});

// 4. SettingsProfileCard contract verification
test('SettingsProfileCard handles avatar, initials, role styling, and verified badge', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/settings/SettingsProfileCard.tsx'), 'utf8');
  assert(content.includes('avatarUrl ?'));
  assert(content.includes('avatarPlaceholder'));
  assert(content.includes('initialLetter'));
  assert(content.includes('styles.roleBadge'));
  assert(content.includes("role === 'Buyer'"));
  assert(content.includes('shield-checkmark'));
  assert(content.includes('profile?.isVerified'));
  assert(content.includes('roleLabel'));
});

// 5. SettingsPresenceCard contract verification
test('SettingsPresenceCard renders status choices with onSelectStatus callback', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/settings/SettingsPresenceCard.tsx'), 'utf8');
  assert(content.includes('PRESENCE_CONFIGS'));
  assert(content.includes('onSelectStatus(statusKey)'));
  assert(content.includes('checkmark-circle'));
  assert(content.includes('cfg.color'));
  assert(content.includes('Brokerage Availability'));
});

// 6. SettingsSecurityCard contract verification
test('SettingsSecurityCard controls AppLock, Biometrics, Pin, and Haptics', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/settings/SettingsSecurityCard.tsx'), 'utf8');
  assert(content.includes('App Lock'));
  assert(content.includes('onToggleAppLock'));
  assert(content.includes('TIMEOUT_OPTIONS.map'));
  assert(content.includes('onSelectTimeout'));
  assert(content.includes('Require Chat PIN'));
  assert(content.includes('onTogglePinRequired'));
  assert(content.includes('biometricsEnabled'));
  assert(content.includes('onToggleBiometrics'));
  assert(content.includes('hapticsEnabled'));
  assert(content.includes('onToggleHaptics'));
});

// 7. SettingsAccountCard contract verification
test('SettingsAccountCard provides safe Sign Out trigger', () => {
  const content = fs.readFileSync(path.join(ROOT, 'components/settings/SettingsAccountCard.tsx'), 'utf8');
  assert(content.includes('onSignOut'));
  assert(content.includes('log-out-outline'));
  assert(content.includes('Sign Out'));
  assert(content.includes('styles.signOutRow'));
});

// 8. SettingsScreen orchestration verification
test('app/(tabs)/settings.tsx cleanly orchestrates modular cards under 200 lines', () => {
  const content = fs.readFileSync(path.join(ROOT, 'app/(tabs)/settings.tsx'), 'utf8');
  assert(content.includes('useSafeAreaInsets'));
  assert(content.includes('AnimatedPageWrapper'));
  assert(content.includes('useAuthProfile'));
  assert(content.includes('clearProfileCache'));
  assert(content.includes('useAppLock'));
  assert(content.includes('useChatPinGate'));
  assert(content.includes('SettingsHeader'));
  assert(content.includes('SettingsProfileCard'));
  assert(content.includes('SettingsPresenceCard'));
  assert(content.includes('SettingsSecurityCard'));
  assert(content.includes('SettingsAccountCard'));
  assert(content.includes('{isProfessional && ('));
  assert(content.includes('roleBadgeStyle={styles.roleBadge}'));
});

console.log(`\n================================================================`);
console.log(`  ALL ${passed} SETTINGS MODULAR ARCHITECTURE CHECKS PASSED!`);
console.log(`================================================================\n`);
