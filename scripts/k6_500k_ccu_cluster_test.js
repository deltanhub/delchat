/**
 * ============================================================================
 * DelChat 500,000 CCU Distributed k6 Load Test Suite
 * ============================================================================
 * 
 * Script designed for distributed execution across a cloud generator cluster
 * (e.g. 50x AWS EC2 c6g.xlarge nodes or Grafana k6 Cloud) to ramp up to
 * 500,000 concurrent active users (CCU) chatting, typing, and querying simultaneously.
 * 
 * Running with k6 locally:
 *   k6 run --vus 500 --duration 1m scripts/k6_500k_ccu_cluster_test.js
 * 
 * Running distributed on Kubernetes / k6-operator:
 *   kubectl apply -f scripts/k6_500k_deployment.yaml
 */

import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom Metrics
const broadcastRtt = new Trend('broadcast_rtt_ms');
const dbQueryDuration = new Trend('db_query_duration_ms');
const connectionErrors = new Rate('connection_errors');
const droppedPackets = new Rate('dropped_packets');
const totalMessages = new Counter('total_messages_exchanged');

// Configuration
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://zcvodgftsojjbwrgczvo.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjdm9kZ2Z0c29qamJ3cmdjenZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjQzMjksImV4cCI6MjA5MTcwMDMyOX0.JINTymJDSi7_LlbtWELAuwfJ3p2FLsqN0s9lwhYLFLw';

// 500k CCU Staged Ramp-up Profile (Cluster Distributed Execution)
export const options = {
  scenarios: {
    delchat_500k_swarm: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m',  target: 25000  }, // Stage 1: Warm-up & Pooler Verification
        { duration: '3m',  target: 100000 }, // Stage 2: 100k CCU Base Load
        { duration: '5m',  target: 250000 }, // Stage 3: 250k CCU Mid Surge
        { duration: '10m', target: 500000 }, // Stage 4: 500k CCU Peak Go-Live
        { duration: '5m',  target: 500000 }, // Stage 5: Sustained 500k Soak Test
        { duration: '5m',  target: 0      }, // Stage 6: Graceful Teardown
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'broadcast_rtt_ms': ['p(95)<300', 'p(99)<800'],
    'db_query_duration_ms': ['p(95)<400', 'p(99)<1000'],
    'connection_errors': ['rate<0.01'], // < 1% error rate
    'dropped_packets': ['rate<0.005'],   // < 0.5% packet drop
  },
};

export default function () {
  const vuId = __VU;
  const channelPartition = `chat_room_${vuId % 2500}`; // Partition across 2,500 active threads

  // 1. Periodic Keyset Database Query (Simulating Inbox & Feed Mount)
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  const queryStart = Date.now();
  const dbRes = http.get(
    `${SUPABASE_URL}/rest/v1/chat_conversations?select=id,created_at,updated_at&order=updated_at.desc&limit=10`,
    { headers }
  );
  dbQueryDuration.add(Date.now() - queryStart);

  check(dbRes, {
    'db query status is 200': (r) => r.status === 200,
  });

  // 2. Realtime WebSocket Phoenix Protocol Connection
  const wsUrl = `${SUPABASE_URL.replace('https', 'wss')}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

  const res = ws.connect(wsUrl, {}, function (socket) {
    let joinRef = 1;
    let messageRef = 1;

    socket.on('open', () => {
      // Phoenix channel join message
      const joinMsg = JSON.stringify({
        topic: `realtime:${channelPartition}`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: true },
            presence: { key: `vu_${vuId}` }
          }
        },
        ref: String(joinRef++),
      });
      socket.send(joinMsg);
    });

    socket.on('message', (data) => {
      totalMessages.add(1);
      try {
        const parsed = JSON.parse(data);
        if (parsed.event === 'broadcast' && parsed.payload?.sentAt) {
          const latency = Date.now() - parsed.payload.sentAt;
          if (latency >= 0 && latency < 30000) {
            broadcastRtt.add(latency);
          }
        }
      } catch (e) {}
    });

    socket.on('error', (e) => {
      connectionErrors.add(1);
    });

    // Chat activity loop: typing, messages, reactions
    for (let i = 0; i < 6; i++) {
      sleep(3 + Math.random() * 2); // 3-5 second human jitter
      
      const payload = JSON.stringify({
        topic: `realtime:${channelPartition}`,
        event: 'broadcast',
        payload: {
          type: 'broadcast',
          event: 'chat_activity',
          vuId: vuId,
          action: i % 2 === 0 ? 'typing' : 'message',
          sentAt: Date.now(),
        },
        ref: String(messageRef++),
      });

      socket.send(payload);
    }

    // Graceful close after duty cycle
    socket.close();
  });

  check(res, {
    'websocket connected successfully': (r) => r && r.status === 101,
  });
}
