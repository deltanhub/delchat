import { sendLiveCallSignal, ChatCallSignalType } from '../../../lib/webrtc-signaling';
import { QueuedSignal } from './types';

export class SignalOutboxQueue {
  private queue: QueuedSignal[] = [];

  push(signalType: ChatCallSignalType, payload: Record<string, any>): void {
    this.queue.push({ signalType, payload });
  }

  flush(
    channel: any,
    params: {
      callId: string;
      conversationId: string;
      senderUserId: string;
      recipientUserId: string;
    }
  ): void {
    while (this.queue.length > 0) {
      const queued = this.queue.shift();
      if (queued) {
        sendLiveCallSignal(channel, {
          callId: params.callId,
          conversationId: params.conversationId,
          senderUserId: params.senderUserId,
          recipientUserId: params.recipientUserId,
          signalType: queued.signalType,
          payload: queued.payload,
        });
      }
    }
  }

  clear(): void {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }
}
