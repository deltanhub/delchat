# DelChat 500,000 CCU Distributed Load Testing & Swarm Manual

This guide documents how to execute live multi-user concurrency testing for DelChat, starting from hundreds of concurrent bots on your local machine all the way to **500,000 Concurrent Active Users (CCU)** across a distributed cloud fleet.

---

## 1. Local Swarm Testing (100 to 2,500 Virtual Bots)

You can launch live mobile virtual bots directly from your machine using our native Node.js runner:
[`scripts/delchat_swarm_runner.js`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/scripts/delchat_swarm_runner.js)

### Available Commands:

```bash
# 1. 100 Bots Pilot Test (15 seconds)
node scripts/delchat_swarm_runner.js --users=100 --duration=15 --rampup=3

# 2. 500 Bots Concurrency Surge (30 seconds)
node scripts/delchat_swarm_runner.js --users=500 --duration=30 --rampup=5

# 3. 1,000 Bots Stress Benchmark (60 seconds)
node scripts/delchat_swarm_runner.js --users=1000 --duration=60 --rampup=10
```

### What Each Virtual Bot Simulates:
1. **Live WebSockets**: Connects directly to `wss://zcvodgftsojjbwrgczvo.supabase.co/realtime/v1/websocket`.
2. **Channel Subscription**: Subscribes to the broadcast channel (`delchat_swarm_cluster`).
3. **Chat Activity**: Sends typing events, text messages, reactions, and VoIP call pings.
4. **PostgreSQL Keyset Queries**: Executes keyset-paginated read requests against `chat_conversations`.
5. **Real-Time Telemetry**: Measures packet delivery rate, end-to-end latency percentiles (p50, p95, p99), and socket stability.

---

## 2. Scaling to 500,000 CCU (Distributed Cloud Fleet)

To hit the platform with **500,000 concurrent active users all doing actions at once**, a distributed fleet is required.

### Topology:
* **Load Generator Fleet**: 40 to 50 cloud worker nodes (e.g. AWS EC2 `c6g.xlarge` or DigitalOcean Droplets).
* **Capacity per Node**: ~10,000 to 12,000 virtual users (VUs) per node.
* **Test Orchestrator**: Grafana k6 distributed runner or `k6-operator` on Kubernetes.

### Test Script:
Use the pre-configured script:
[`scripts/k6_500k_ccu_cluster_test.js`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/scripts/k6_500k_ccu_cluster_test.js)

### Staged Ramp-up Schedule:
| Stage | Duration | Target Concurrent Users | Purpose |
| :--- | :--- | :--- | :--- |
| **1** | 2 minutes | 25,000 VUs | Warm up Supavisor connection pooler & TLS handshakes |
| **2** | 3 minutes | 100,000 VUs | Establish baseline active chat load |
| **3** | 5 minutes | 250,000 VUs | Mid-day peak traffic simulation |
| **4** | 10 minutes | **500,000 VUs** | **Full Go-Live Max Surge** |
| **5** | 5 minutes | 500,000 VUs | Sustained soak test (memory leak & timeout audit) |
| **6** | 5 minutes | 0 VUs | Graceful socket teardown |

---

## 3. Cloud Backend Requirements for 500k Live Users

Before running the 500k CCU distributed test, ensure your cloud backend matches:
1. **Supavisor Pooling**: Port 6543, Transaction mode (`default_pool_size >= 120`, `max_client_conn >= 15000`).
2. **PostgreSQL Indexes**: Apply [`db/migrations/20260904_500k_ccu_indexes.sql`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/db/migrations/20260904_500k_ccu_indexes.sql) so 500k queries perform index seeks with 0 sequential table scans.
3. **Phoenix Realtime**: Clustered multi-node Realtime deployment on Supabase Enterprise.
