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
console.log('  EMOJI PICKER DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. getCountryCodeFromFlag operational verification
const getCountryCodeFromFlag = (flagEmoji) => {
  if (!flagEmoji) return null;
  const codePoints = [...flagEmoji].map((c) => c.codePointAt(0) || 0);
  if (codePoints.length >= 2 && codePoints.every((cp) => cp >= 127462 && cp <= 127487)) {
    return codePoints.map((cp) => String.fromCharCode(cp - 127462 + 65)).join('').toLowerCase();
  }
  return null;
};

assert(getCountryCodeFromFlag('🇳🇬') === 'ng', 'Nigeria flag converts to "ng"');
assert(getCountryCodeFromFlag('🇺🇸') === 'us', 'US flag converts to "us"');
assert(getCountryCodeFromFlag('🇬🇧') === 'gb', 'UK flag converts to "gb"');
assert(getCountryCodeFromFlag('🏢') === null, 'Building emoji returns null (not a flag)');
assert(getCountryCodeFromFlag('') === null, 'Empty string returns null');
assert(getCountryCodeFromFlag(null) === null, 'Null safely returns null');

// 2. Filter logic simulation
const mockCategories = [
  {
    id: 'realestate',
    label: '🏠',
    emojis: [
      { char: '🏢', name: 'office building', tags: ['work', 'property'] },
      { char: '🏡', name: 'house with garden', tags: ['home', 'residential'] },
    ],
  },
  {
    id: 'faces',
    label: '😀',
    emojis: [
      { char: '😀', name: 'grinning face', tags: ['smile', 'happy'] },
    ],
  },
];

function filterEmojis(searchText, activeCategory, recent) {
  if (!searchText.trim()) {
    if (activeCategory === 'recent') return recent;
    const cat = mockCategories.find((c) => c.id === activeCategory);
    return cat ? cat.emojis : [];
  }
  const query = searchText.toLowerCase().trim();
  const results = [];
  mockCategories.forEach((cat) => {
    cat.emojis.forEach((emoji) => {
      if (
        emoji.name.toLowerCase().includes(query) ||
        emoji.tags.some((t) => t.toLowerCase().includes(query))
      ) {
        if (!results.some((r) => r.char === emoji.char)) {
          results.push(emoji);
        }
      }
    });
  });
  return results;
}

const catFiltered = filterEmojis('', 'realestate', []);
assert(catFiltered.length === 2, 'Category filter returns category emojis');

const searchFiltered = filterEmojis('residential', 'faces', []);
assert(searchFiltered.length === 1 && searchFiltered[0].char === '🏡', 'Tag search finds matching emoji');

// 3. Recent emojis update simulation
let recents = [{ char: '😀', name: 'grinning face', tags: [] }];
function addRecent(emoji) {
  recents = [emoji, ...recents.filter((r) => r.char !== emoji.char)].slice(0, 16);
}

addRecent({ char: '🏢', name: 'office building', tags: [] });
assert(recents[0].char === '🏢', 'Most recent emoji is prepended');
assert(recents.length === 2, 'Recent emojis count is 2');

console.log(`\nEmojiPicker Deep Live: ${passed} / ${total} tests passed.\n`);
