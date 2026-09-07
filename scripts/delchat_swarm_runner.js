#!/usr/bin/env node
/**
 * ============================================================================
 * DelChat Industrial Multi-Bot Swarm & Concurrency Stress Runner
 * ============================================================================
 * 
 * Simulates hundreds to thousands of concurrent headless DelChat mobile clients
 * connecting simultaneously to live Supabase Realtime WebSockets, exchanging
 * broadcast signals, typing indicators, VoIP call handshakes, and executing
 * keyset database queries against live infrastructure.
 * 
 * Usage:
 *   node scripts/delchat_swarm_runner.js [options]
 * 
 * Options:
 *   --users=<number>     Concurrent virtual users (default: 100)
 *   --duration=<seconds> Test duration in seconds (default: 30)
 *   --rampup=<seconds>   Connection ramp-up interval (default: 5)
 *   --channel=<name>     Realtime channel partition (default: swarm_test)
 *   --chat-rate=<hz>     Per-user broadcast rate in Hz (default: 0.2 = every 5s)
 *   --query-rate=<hz>    Per-user DB query rate in Hz (default: 0.1 = every 10s)
 */

const path = require('path');
const fs = require('fs');

// Resolve Supabase JS client from delchat node_modules
const { createClient } = require(path.resolve(__dirname, '../node_modules/@supabase/supabase-js'));

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.split('=');
  const key = k.replace(/^--/, '');
  acc[key] = v !== undefined ? v : true;
  return acc;
}, {});

const NUM_USERS = parseInt(args.users || '100', 10);
const DURATION_SEC = parseInt(args.duration || '30', 10);
const RAMPUP_SEC = parseInt(args.rampup || '5', 10);
const CHANNEL_NAME = args.channel || 'delchat_swarm_cluster';
const CHAT_RATE = parseFloat(args['chat-rate'] || '0.2');
const QUERY_RATE = parseFloat(args['query-rate'] || '0.1');

// Production Supabase configuration from .env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zcvodgftsojjbwrgczvo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjdm9kZ2Z0c29qamJ3cmdjenZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjQzMjksImV4cCI6MjA5MTcwMDMyOX0.JINTymJDSi7_LlbtWELAuwfJ3p2FLsqN0s9lwhYLFLw';

console.log('\n================================================================');
console.log('   DELCHAT CONCURRENT MULTI-BOT SWARM STRESS RUNNER (LIVE)      ');
console.log('================================================================');
console.log(` Target Cloud URL  : ${SUPABASE_URL}`);
console.log(` Virtual Users (VU): ${NUM_USERS} concurrent mobile bots`);
console.log(` Test Duration     : ${DURATION_SEC} seconds`);
console.log(` Ramp-up Period    : ${RAMPUP_SEC} seconds (${(NUM_USERS / RAMPUP_SEC).toFixed(1)} conn/sec)`);
console.log(` Realtime Channel  : ${CHANNEL_NAME}`);
console.log(` Activity Profile  : Broadcast: ${CHAT_RATE} Hz | DB Query: ${QUERY_RATE} Hz`);
console.log('================================================================\n');

// Telemetry Metrics
const metrics = {
  socketsConnecting: 0,
  socketsConnected: 0,
  peakConnected: 0,
  socketsErrored: 0,
  socketsClosed: 0,
  broadcastsSent: 0,
  broadcastsReceived: 0,
  broadcastErrors: 0,
  dbQueriesSent: 0,
  dbQueriesSuccess: 0,
  dbQueriesFailed: 0,
  latencies: [],
  dbLatencies: [],
  startTime: 0,
  endTime: 0
};

class VirtualUserBot {
  constructor(id) {
    this.id = id;
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: {
        params: { eventsPerSecond: 20 }
      }
    });
    this.channel = null;
    this.chatInterval = null;
    this.queryInterval = null;
    this.isConnected = false;
  }

  async connect() {
    metrics.socketsConnecting++;
    
    const roomName = `${CHANNEL_NAME}_room_${this.id % 50}`;
    this.channel = this.client.channel(roomName, {
      config: { broadcast: { self: true } }
    });

    this.channel
      .on('broadcast', { event: 'chat_activity' }, (payload) => {
        metrics.broadcastsReceived++;
        if (payload?.payload?.sentAt) {
          const rtt = Date.now() - payload.payload.sentAt;
          if (rtt >= 0 && rtt < 10000) {
            metrics.latencies.push(rtt);
            if (metrics.latencies.length > 5000) {
              metrics.latencies.shift(); // Keep bounded ring buffer
            }
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!this.isConnected) {
            this.isConnected = true;
            metrics.socketsConnecting--;
            metrics.socketsConnected++;
            metrics.peakConnected = Math.max(metrics.peakConnected, metrics.socketsConnected);
            this.startSimulation();
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          metrics.socketsErrored++;
        } else if (status === 'CLOSED') {
          if (this.isConnected) {
            this.isConnected = false;
            metrics.socketsConnected--;
            metrics.socketsClosed++;
          }
        }
      });
  }

  startSimulation() {
    // 1. Immediate initial database query
    this.executeDbQuery();

    // 2. Periodic Broadcast Activity (typing, message, reaction, call signal)
    const chatIntervalMs = Math.max(500, Math.floor(1000 / CHAT_RATE));
    // Add jitter so all bots don't pulse on the exact same millisecond
    const jitter = Math.floor(Math.random() * 800);
    
    setTimeout(() => {
      this.chatInterval = setInterval(() => {
        if (!this.isConnected) return;
        this.emitActivity();
      }, chatIntervalMs);
    }, jitter);

    // 2. Periodic Database Keyset Read Query
    const queryIntervalMs = Math.max(1000, Math.floor(1000 / QUERY_RATE));
    setTimeout(() => {
      this.queryInterval = setInterval(() => {
        if (!this.isConnected) return;
        this.executeDbQuery();
      }, queryIntervalMs);
    }, jitter + 200);
  }

  async emitActivity() {
    metrics.broadcastsSent++;
    const actionKinds = ['message', 'typing', 'reaction', 'call_ping'];
    const selectedKind = actionKinds[this.id % actionKinds.length];

    try {
      const res = await this.channel.send({
        type: 'broadcast',
        event: 'chat_activity',
        payload: {
          botId: this.id,
          action: selectedKind,
          sentAt: Date.now()
        }
      });
      if (res !== 'ok') {
        metrics.broadcastErrors++;
      }
    } catch (e) {
      metrics.broadcastErrors++;
    }
  }

  async executeDbQuery() {
    metrics.dbQueriesSent++;
    const queryStart = Date.now();
    try {
      const { data, error } = await this.client
        .from('chat_conversations')
        .select('id, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);
        
      const elapsed = Date.now() - queryStart;
      metrics.dbLatencies.push(elapsed);
      if (metrics.dbLatencies.length > 2000) {
        metrics.dbLatencies.shift();
      }

      if (error) {
        metrics.dbQueriesFailed++;
      } else {
        metrics.dbQueriesSuccess++;
      }
    } catch (e) {
      metrics.dbQueriesFailed++;
    }
  }

  async disconnect() {
    if (this.chatInterval) clearInterval(this.chatInterval);
    if (this.queryInterval) clearInterval(this.queryInterval);
    if (this.channel) {
      try {
        await this.client.removeChannel(this.channel);
      } catch {}
    }
  }
}

// Percentile calculator
function getPercentiles(arr) {
  if (!arr.length) return { min: 0, p50: 0, p95: 0, p99: 0, max: 0, avg: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0],
    p50: sorted[Math.floor(sorted.length * 0.50)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length)
  };
}

// Swarm Master Orchestrator
async function runSwarm() {
  metrics.startTime = Date.now();
  const bots = [];

  for (let i = 0; i < NUM_USERS; i++) {
    bots.push(new VirtualUserBot(i + 1));
  }

  console.log(`[Ramp-up] Spawning ${NUM_USERS} virtual bots over ${RAMPUP_SEC} seconds...`);
  const rampupDelayMs = (RAMPUP_SEC * 1000) / NUM_USERS;

  // Staggered launch to prevent local socket exhaustion
  let botIndex = 0;
  const rampupTimer = setInterval(() => {
    if (botIndex < bots.length) {
      bots[botIndex].connect();
      botIndex++;
    } else {
      clearInterval(rampupTimer);
    }
  }, Math.max(5, rampupDelayMs));

  // Periodic Telemetry Logger
  let lastSent = 0;
  let lastRecv = 0;
  let lastQueries = 0;
  let tickCount = 0;

  const telemetryInterval = setInterval(() => {
    tickCount++;
    const now = Date.now();
    const elapsedSec = Math.floor((now - metrics.startTime) / 1000);
    const sentRate = metrics.broadcastsSent - lastSent;
    const recvRate = metrics.broadcastsReceived - lastRecv;
    const qRate = metrics.dbQueriesSuccess - lastQueries;
    
    lastSent = metrics.broadcastsSent;
    lastRecv = metrics.broadcastsReceived;
    lastQueries = metrics.dbQueriesSuccess;

    const rttStats = getPercentiles(metrics.latencies);
    const memMb = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);

    process.stdout.write(
      `[T+${String(elapsedSec).padStart(2, '0')}s] ` +
      `Sockets: ${String(metrics.socketsConnected).padStart(4, ' ')}/${NUM_USERS} live | ` +
      `Brdcst: ↑${sentRate}/s ↓${recvRate}/s (p95: ${rttStats.p95}ms) | ` +
      `DB: ${qRate} req/s | ` +
      `Err: ${metrics.socketsErrored + metrics.broadcastErrors} | ` +
      `RAM: ${memMb}MB\n`
    );

    if (elapsedSec >= DURATION_SEC) {
      clearInterval(telemetryInterval);
      stopSwarm(bots);
    }
  }, 1000);
}

async function stopSwarm(bots) {
  metrics.endTime = Date.now();
  console.log('\n[Tearing Down] Gracefully closing virtual bot sockets...');
  
  const disconnectPromises = bots.map(b => b.disconnect());
  await Promise.all(disconnectPromises);

  const totalDurationSec = ((metrics.endTime - metrics.startTime) / 1000).toFixed(1);
  const rtt = getPercentiles(metrics.latencies);
  const dbRtt = getPercentiles(metrics.dbLatencies);
  const totalBroadcasts = metrics.broadcastsSent;
  const successRate = totalBroadcasts > 0
    ? (((totalBroadcasts - metrics.broadcastErrors) / totalBroadcasts) * 100).toFixed(2)
    : '100.00';

  console.log('\n================================================================');
  console.log('              SWARM STRESS TEST EXECUTION REPORT               ');
  console.log('================================================================');
  console.log(` Total Duration         : ${totalDurationSec} seconds`);
  console.log(` Peak Concurrent Users  : ${metrics.peakConnected} connected sockets`);
  console.log(` Total Broadcast Signals: ${metrics.broadcastsSent} sent | ${metrics.broadcastsReceived} received`);
  console.log(` Signal Delivery Rate   : ${successRate}% (${metrics.broadcastErrors} errors)`);
  console.log(` Database Keyset Queries: ${metrics.dbQueriesSuccess} succeeded | ${metrics.dbQueriesFailed} failed`);
  console.log('----------------------------------------------------------------');
  console.log(' Realtime Broadcast Latency (End-to-End):');
  console.log(`   Min : ${rtt.min} ms   |   Avg : ${rtt.avg} ms`);
  console.log(`   p50 : ${rtt.p50} ms   |   p95 : ${rtt.p95} ms   |   p99 : ${rtt.p99} ms`);
  console.log(' Database Query Latency (PostgreSQL):');
  console.log(`   Min : ${dbRtt.min} ms   |   Avg : ${dbRtt.avg} ms   |   p95 : ${dbRtt.p95} ms`);
  console.log('================================================================\n');

  if (metrics.peakConnected >= Math.floor(NUM_USERS * 0.8) && parseFloat(successRate) >= 95) {
    console.log('>>> VERDICT: LIVE CONCURRENCY TEST PASSED WITH HEALTH GRADE A <<<');
    process.exit(0);
  } else {
    console.log('>>> VERDICT: BOT CONCURRENCY DEGRADATION DETECTED <<<');
    process.exit(1);
  }
}

// Start runner
runSwarm().catch(err => {
  console.error('Fatal swarm error:', err);
  process.exit(1);
});
