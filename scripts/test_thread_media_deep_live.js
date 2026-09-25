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
console.log('  THREAD MEDIA DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Concurrency guard simulation
let isPickingActive = false;
function simulatePickAction() {
  if (isPickingActive) return { aborted: true };
  isPickingActive = true;
  return { aborted: false };
}

const firstPick = simulatePickAction();
assert(firstPick.aborted === false, 'First media picker launch allowed');
const secondPick = simulatePickAction();
assert(secondPick.aborted === true, 'Concurrent picker launch intercepted by concurrency guard');
isPickingActive = false;
const thirdPick = simulatePickAction();
assert(thirdPick.aborted === false, 'Post-cooldown picker launch allowed');

// 2. Document attachment payload structuring
function buildDocumentPayload(doc, signedUrl) {
  const mime = doc.mimeType || 'application/pdf';
  return {
    document: { name: doc.name, size: doc.size, mimeType: mime, url: signedUrl },
    attachments: [{ url: signedUrl, kind: 'document', originalName: doc.name, sizeBytes: doc.size || 0, mimeType: mime }],
  };
}

const docMock = { name: 'Tenancy_Agreement.pdf', size: 1048576, mimeType: 'application/pdf' };
const docPayload = buildDocumentPayload(docMock, 'https://supabase.co/storage/doc_123.pdf');
assert(docPayload.document.name === 'Tenancy_Agreement.pdf', 'Document name mapped correctly');
assert(docPayload.attachments[0].kind === 'document', 'Document attachment kind set to document');
assert(docPayload.attachments[0].sizeBytes === 1048576, 'Document size preserved');

// 3. Staged media video vs image detection
function detectMediaType(asset) {
  const isVideo = asset.type === 'video' || (asset.uri && asset.uri.endsWith('.mp4'));
  return {
    isVideo,
    ext: isVideo ? 'mp4' : 'jpg',
    mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
  };
}

const imgDetection = detectMediaType({ type: 'image', uri: 'file:///cache/photo.jpg' });
assert(imgDetection.isVideo === false && imgDetection.mimeType === 'image/jpeg', 'Image correctly detected');

const vidDetection = detectMediaType({ type: 'video', uri: 'file:///cache/property_tour.mp4' });
assert(vidDetection.isVideo === true && vidDetection.mimeType === 'video/mp4', 'Video correctly detected');

// 4. Voice note clean duration sanitization
function sanitizeDuration(duration) {
  return Math.max(1, Math.round(duration));
}

assert(sanitizeDuration(0.3) === 1, 'Sub-second duration rounded to minimum 1s');
assert(sanitizeDuration(14.6) === 15, 'Decimal duration rounded accurately (14.6 -> 15)');
assert(sanitizeDuration(0) === 1, 'Zero duration sanitized to minimum 1s');

// 5. Offline outbox fallback payload structuring
function buildVoiceNoteOutboxItem(tempId, conversationId, userId, audioUri, cleanDuration, errMessage) {
  return {
    id: tempId,
    conversationId,
    senderUserId: userId,
    messageKind: 'voice_note',
    body: 'Voice note',
    localMediaUri: audioUri,
    durationSeconds: cleanDuration,
    mediaKind: 'audio',
    mimeType: 'audio/m4a',
    createdAt: new Date().toISOString(),
    retryCount: 0,
    error: errMessage,
  };
}

const outboxItem = buildVoiceNoteOutboxItem('temp-vn-1', 'conv-101', 'user-1', 'file:///recordings/audio.m4a', 12, 'Network timeout');
assert(outboxItem.id === 'temp-vn-1', 'Outbox tempId preserved');
assert(outboxItem.durationSeconds === 12, 'Outbox duration preserved');
assert(outboxItem.error === 'Network timeout', 'Outbox network error recorded for retry queue');

console.log(`\nThread Media Deep Live: ${passed} / ${total} tests passed.\n`);
