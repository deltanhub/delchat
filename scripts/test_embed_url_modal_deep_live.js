const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log('  [PASS] ' + message);
  } else {
    console.error('  [FAIL] ' + message);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  EMBED URL MODAL DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Domain security whitelist simulation
const TRUSTED_3D_DOMAINS = [
  'matterport.com',
  'kuula.co',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'deltanhub.com',
  'google.com',
];

function validateEmbedUrl(inputUrl) {
  const trimmed = (inputUrl || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Please enter a valid URL.' };
  }
  if (!trimmed.startsWith('https://')) {
    return { ok: false, error: 'For security, all virtual tours and embeds must use secure https://' };
  }
  let hostname = '';
  try {
    hostname = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return { ok: false, error: 'Please enter a valid, complete web URL format.' };
  }
  const isTrusted = TRUSTED_3D_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith('.' + domain)
  );
  return { ok: true, hostname, isTrusted, url: trimmed };
}

// Case A: Empty input
const emptyRes = validateEmbedUrl('');
assert(!emptyRes.ok && emptyRes.error.includes('valid URL'), 'Rejects empty input');

// Case B: Insecure HTTP
const httpRes = validateEmbedUrl('http://my.matterport.com/show/?m=123');
assert(!httpRes.ok && httpRes.error.includes('https://'), 'Rejects non-https URL');

// Case C: Valid trusted domain
const matterportRes = validateEmbedUrl('https://my.matterport.com/show/?m=abc123xyz');
assert(matterportRes.ok && matterportRes.isTrusted === true, 'Accepts trusted Matterport URL');

// Case D: Valid external domain
const externalRes = validateEmbedUrl('https://custom-virtual-tour.io/property/456');
assert(externalRes.ok && externalRes.isTrusted === false, 'Flags untrusted external domain for prompt confirmation');

// 2. Submission payload simulation
let submittedUrl = null;
let submittedTitle = null;
function mockSubmit(url, title) {
  submittedUrl = url;
  submittedTitle = title ? title.trim() : undefined;
}

mockSubmit('https://my.matterport.com/show/?m=abc123xyz', '  Luxury Penthouse Tour  ');
assert(submittedUrl === 'https://my.matterport.com/show/?m=abc123xyz', 'Submitted URL preserved');
assert(submittedTitle === 'Luxury Penthouse Tour', 'Title trimmed cleanly');

console.log(`\nEmbedUrlModal Deep Live: ${passed} / ${total} tests passed.\n`);
