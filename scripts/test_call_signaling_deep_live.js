const assert = require('assert');

console.log('\n================================================================');
console.log('  CALL SIGNALING DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

let passed = 0;
function check(cond, msg) {
  assert(cond, msg);
  console.log(`  [PASS] ${msg}`);
  passed++;
}

// 1. Simulate Outbox Queue
class SignalOutboxQueue {
  constructor() {
    this.queue = [];
  }
  push(signalType, payload) {
    this.queue.push({ signalType, payload });
  }
  flush(channel, params) {
    while (this.queue.length > 0) {
      const q = this.queue.shift();
      if (q) channel.sent.push({ ...params, signalType: q.signalType, payload: q.payload });
    }
  }
}

const outbox = new SignalOutboxQueue();
outbox.push('offer', { sdp: 'v=0...' });
outbox.push('ice-candidate', { candidate: 'candidate:1...' });
check(outbox.queue.length === 2, 'Outbox correctly buffers 2 signals when offline/unsubscribed');

const mockChannel = { sent: [] };
outbox.flush(mockChannel, { callId: 'c-1', conversationId: 'conv-1', senderUserId: 'u-1', recipientUserId: 'u-2' });
check(outbox.queue.length === 0, 'Outbox completely flushes all signals');
check(mockChannel.sent.length === 2, 'All 2 signals delivered to realtime channel');
check(mockChannel.sent[0].signalType === 'offer', 'First signal preserves FIFO ordering (offer)');
check(mockChannel.sent[1].signalType === 'ice-candidate', 'Second signal preserves FIFO ordering (ice-candidate)');

// 2. Simulate Signal Router
function routeIncomingCallSignal(sig, currentUserId, callbacks) {
  if (!sig || sig.senderUserId === currentUserId) return;
  switch (sig.signalType) {
    case 'offer': callbacks.onOffer?.(sig.payload?.sdp, !!sig.payload?.isIceRestart); break;
    case 'answer': callbacks.onAnswer?.(sig.payload?.sdp); break;
    case 'ice-candidate': callbacks.onIceCandidate?.(sig.payload); break;
    case 'hangup': callbacks.onHangup?.(sig.payload?.reason); break;
    case 'media-state': callbacks.onMediaState?.(sig.payload); break;
  }
}

let routedOffer = null;
let routedHangup = null;
const callbacks = {
  onOffer: (sdp) => { routedOffer = sdp; },
  onHangup: (reason) => { routedHangup = reason; },
};

routeIncomingCallSignal({ senderUserId: 'u-1', signalType: 'offer', payload: { sdp: 'mock-sdp' } }, 'u-1', callbacks);
check(routedOffer === null, 'Self-signals correctly dropped by sender guard');

routeIncomingCallSignal({ senderUserId: 'u-2', signalType: 'offer', payload: { sdp: 'peer-sdp' } }, 'u-1', callbacks);
check(routedOffer === 'peer-sdp', 'Remote peer offer routed to onOffer');

routeIncomingCallSignal({ senderUserId: 'u-2', signalType: 'hangup', payload: { reason: 'user_ended' } }, 'u-1', callbacks);
check(routedHangup === 'user_ended', 'Remote hangup routed with reason');

console.log(`\nCall Signaling Deep Live: ${passed} / ${passed} tests passed.\n`);
