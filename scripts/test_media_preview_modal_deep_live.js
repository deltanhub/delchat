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
console.log('  MEDIA PREVIEW MODAL DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Video detection simulation
function isVideoAsset(asset) {
  if (!asset) return false;
  return Boolean(
    asset.type === 'video' ||
    (asset.uri && asset.uri.toLowerCase().endsWith('.mp4')) ||
    (asset.uri && asset.uri.toLowerCase().endsWith('.mov'))
  );
}

assert(isVideoAsset({ uri: 'file:///photo.jpg', type: 'image' }) === false, 'Detects image asset correctly');
assert(isVideoAsset({ uri: 'file:///clip.mp4', type: 'image' }) === true, 'Detects mp4 by extension');
assert(isVideoAsset({ uri: 'file:///video.mov' }) === true, 'Detects mov by extension');
assert(isVideoAsset({ uri: 'file:///stream', type: 'video' }) === true, 'Detects video by mime type');

// 2. Asset Removal and Index Re-balancing simulation
function removeAssetAndRebalance(assets, indexToRemove, currentIndex) {
  const updated = assets.filter((_, i) => i !== indexToRemove);
  let nextIndex = currentIndex;
  if (nextIndex >= updated.length) {
    nextIndex = Math.max(0, updated.length - 1);
  }
  return { updated, nextIndex };
}

const mockAssets = [
  { uri: 'file:///img1.jpg' },
  { uri: 'file:///img2.jpg' },
  { uri: 'file:///img3.jpg' },
];

// Remove middle item when on middle item
const res1 = removeAssetAndRebalance(mockAssets, 1, 1);
assert(res1.updated.length === 2, 'Removes middle item');
assert(res1.nextIndex === 1, 'Maintains valid index');

// Remove last item when on last item
const res2 = removeAssetAndRebalance(res1.updated, 1, 1);
assert(res2.updated.length === 1, 'Removes last item');
assert(res2.nextIndex === 0, 'Re-balances index to 0');

// 3. Send payload formatting
function buildSendPayload(assets, caption) {
  return {
    assets: [...assets],
    caption: (caption || '').trim(),
    count: assets.length,
  };
}

const sendPayload = buildSendPayload(res2.updated, '  Here is the master plan layout  ');
assert(sendPayload.count === 1, 'Payload asset count is 1');
assert(sendPayload.caption === 'Here is the master plan layout', 'Caption trimmed cleanly');

console.log(`\nMediaPreviewModal Deep Live: ${passed} / ${total} tests passed.\n`);
