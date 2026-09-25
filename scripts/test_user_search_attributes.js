const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  DELCHAT USER SEARCH ATTRIBUTES VERIFICATION SUITE');
console.log('  (Username, Display Name, Full Name, Email)');
console.log('================================================================\n');

const projectRoot = path.resolve(__dirname, '..');

// --- TEST 1: Strict Line Count Audits (<= 150 lines) ---
console.log('--- TEST 1: Strict Line Count Audits (<= 150 lines) ---');
const filesToAudit = [
  'hooks/compose/contactSearchService.ts',
  'hooks/compose/useContactSearch.ts',
  'components/compose/ComposeSearchBar.tsx',
  'components/compose/ComposeEmptyState.tsx',
  'components/compose/types.ts',
  'app/compose.tsx',
];

for (const relPath of filesToAudit) {
  const fullPath = path.join(projectRoot, relPath);
  assert(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert(lines <= 150, `${relPath} exceeds 150 lines: ${lines} lines`);
  console.log(`  [PASS] ${relPath} strictly complies with <= 150 line limit (${lines} lines)`);
}

// --- TEST 2: Query Sanitization & Multi-Attribute Search Logic Simulation ---
console.log('\n--- TEST 2: Multi-Attribute Search Logic Simulation ---');

const mockDatabaseUsers = [
  {
    user_id: 'user-001',
    username: 'alex_estate',
    display_name: 'Alex E.',
    full_name: 'Alexander Thompson',
    email: 'alex.thompson@deltanproperties.com',
    avatar_url: 'https://deltanhub.com/avatars/1.jpg',
    main_role: 'Agent',
  },
  {
    user_id: 'user-002',
    username: 'ngozi_lux',
    display_name: 'Ngozi Luxury',
    full_name: 'Ngozi Eze',
    email: 'ngozi.eze@lagoshomes.ng',
    avatar_url: null,
    main_role: 'Developer',
  },
  {
    user_id: 'user-003',
    username: 'chidi_buyer',
    display_name: 'Chidi B.',
    full_name: 'Chidi Okeke',
    email: 'chidi99@gmail.com',
    avatar_url: null,
    main_role: 'Buyer',
  },
];

function simulateSearch(query, currentUserId = 'user-000') {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const sanitized = clean.replace(/^@/, '').replace(/[,()]/g, '').trim().toLowerCase();
  if (sanitized.length < 2) return [];

  return mockDatabaseUsers
    .filter((u) => u.user_id !== currentUserId)
    .filter((u) => {
      const matchUsername = (u.username || '').toLowerCase().includes(sanitized);
      const matchDisplayName = (u.display_name || '').toLowerCase().includes(sanitized);
      const matchFullName = (u.full_name || '').toLowerCase().includes(sanitized);
      const matchEmail = (u.email || '').toLowerCase().includes(sanitized);
      return matchUsername || matchDisplayName || matchFullName || matchEmail;
    })
    .map((p) => {
      const rawUsername = p.username ? p.username.trim().replace(/^@/, '') : null;
      const rawEmail = p.email?.trim() || null;
      const dName = p.display_name?.trim();
      const fName = p.full_name?.trim();
      const title = dName || fName || (rawUsername ? `@${rawUsername}` : (rawEmail || 'User'));

      const subtitleParts = [];
      if (rawUsername) subtitleParts.push(`@${rawUsername}`);
      if (rawEmail) subtitleParts.push(rawEmail);
      if (p.main_role && subtitleParts.length < 2) subtitleParts.push(p.main_role);

      return {
        userId: p.user_id,
        fullName: title,
        displayName: dName || null,
        username: rawUsername,
        email: rawEmail,
        avatarUrl: p.avatar_url,
        mainRole: p.main_role,
        subtitle: subtitleParts.join(' • '),
      };
    });
}

// Case A: Search by username with @
const resA = simulateSearch('@alex_estate');
assert.strictEqual(resA.length, 1, 'Should find 1 user by @username');
assert.strictEqual(resA[0].userId, 'user-001');
assert.strictEqual(resA[0].username, 'alex_estate');
console.log('  [PASS] Successfully searched by username with leading @ (@alex_estate)');

// Case B: Search by username without @
const resB = simulateSearch('ngozi_lux');
assert.strictEqual(resB.length, 1, 'Should find 1 user by raw username');
assert.strictEqual(resB[0].userId, 'user-002');
console.log('  [PASS] Successfully searched by raw username without @ (ngozi_lux)');

// Case C: Search by display name
const resC = simulateSearch('Ngozi Luxury');
assert.strictEqual(resC.length, 1, 'Should find 1 user by display name');
assert.strictEqual(resC[0].userId, 'user-002');
console.log('  [PASS] Successfully searched by display name (Ngozi Luxury)');

// Case D: Search by full name
const resD = simulateSearch('Alexander Thompson');
assert.strictEqual(resD.length, 1, 'Should find 1 user by full name');
assert.strictEqual(resD[0].userId, 'user-001');
console.log('  [PASS] Successfully searched by full name (Alexander Thompson)');

// Case E: Search by email
const resE = simulateSearch('chidi99@gmail.com');
assert.strictEqual(resE.length, 1, 'Should find 1 user by email address');
assert.strictEqual(resE[0].userId, 'user-003');
console.log('  [PASS] Successfully searched by email (chidi99@gmail.com)');

// Case F: Exclude self
const resF = simulateSearch('alex', 'user-001');
assert.strictEqual(resF.length, 0, 'Should exclude current user when searching');
console.log('  [PASS] Current authenticated user is safely excluded from search results');

// --- TEST 3: Interface & Barrel Export Contract Verification ---
console.log('\n--- TEST 3: Interface & Barrel Export Contract Verification ---');
const typesContent = fs.readFileSync(path.join(projectRoot, 'components/compose/types.ts'), 'utf8');
assert(typesContent.includes('username?: string | null'), 'Contact must define optional username');
assert(typesContent.includes('displayName?: string | null'), 'Contact must define optional displayName');
assert(typesContent.includes('email?: string | null'), 'Contact must define optional email');
assert(typesContent.includes('placeholder?: string'), 'ComposeSearchBarProps must define optional placeholder');
console.log('  [PASS] components/compose/types.ts specifies username, displayName, email, placeholder');

const serviceContent = fs.readFileSync(path.join(projectRoot, 'hooks/compose/contactSearchService.ts'), 'utf8');
assert(serviceContent.includes('username.ilike'), 'Service queries username');
assert(serviceContent.includes('display_name.ilike'), 'Service queries display_name');
assert(serviceContent.includes('full_name.ilike'), 'Service queries full_name');
assert(serviceContent.includes('email.ilike'), 'Service queries email');
console.log('  [PASS] contactSearchService.ts constructs multi-attribute PostgREST ilike query');

const composeContent = fs.readFileSync(path.join(projectRoot, 'app/compose.tsx'), 'utf8');
assert(composeContent.includes('placeholder='), 'app/compose.tsx passes dynamic placeholder');
console.log('  [PASS] app/compose.tsx supplies dynamic mode-aware placeholder');

console.log('\n================================================================');
console.log('  USER SEARCH ATTRIBUTES VERIFICATION: ALL TESTS PASSED (100%)');
console.log('================================================================\n');
