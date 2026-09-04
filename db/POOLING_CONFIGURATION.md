# DelChat 500k CCU Supavisor Connection Pooling Specification

> **Target Capacity**: 500,000 Concurrent Active Users (500k CCU)  
> **Database Engine**: PostgreSQL 15+ hosted on Supabase Enterprise  
> **Connection Pooler**: Supavisor (Port 6543, Transaction Mode)  
> **Document Version**: 1.0 (2026-09-04)

---

## 1. Connection Topology & Port Isolation

Direct client database access at 500k CCU will exhaust PostgreSQL worker processes within seconds if routed to Port 5432. All traffic is segregated as follows:

| Client Layer | Interface Protocol | Connection Port | Pool Mode | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **DelChat Mobile App** | HTTPS / PostgREST (Supabase JS) | `443` | Managed PostgREST Pool | Zero client DB socket management; connection pooling handled by internal PostgREST gateway. |
| **Supabase Realtime** | WSS (Phoenix Channels) | `443` | Dedicated Replication Slots | Wal2json/pgoutput stream; does NOT spawn per-client Postgres connections. |
| **Backend Edge Functions & Push Dispatch** | Direct TCP / PostgreSQL URI | `6543` | `transaction` | Shared worker pool; connections released immediately after statement completion. |
| **Migrations & DDL Operations** | Direct TCP / PostgreSQL URI | `5432` | `session` | Exclusive to DDL schema migrations (`20260904_500k_ccu_indexes.sql`). |

---

## 2. Supavisor Sizing & Operational Limits (500k CCU Scale)

Configure the following parameters in Supabase Dashboard -> Database -> Connection Pooling:

```ini
[supavisor]
# Operational Port
port = 6543

# Pool Mode: MUST be 'transaction' for high-throughput mobile backends
# In transaction mode, a connection is allocated only for the duration of a transaction,
# allowing 100-120 physical Postgres connections to serve tens of thousands of concurrent requests.
pool_mode = "transaction"

# Default Pool Size: Number of dedicated Postgres connections allocated to the pooler
default_pool_size = 120

# Max Client Connections: Total number of concurrent client sockets Supavisor will accept
max_client_conn = 15000

# Connection Lifetime & Checkout Limits
client_idle_timeout = 30000        # Close idle client sockets after 30s
server_idle_timeout = 60000        # Close idle backend Postgres sockets after 60s
statement_timeout = 8000           # 8-second circuit breaker on queries to prevent lock starvation
idle_in_transaction_session_timeout = 5000 # 5-second kill on abandoned transactions
```

---

## 3. Production Connection String Formats

### For Edge Functions, Serverless APIs & Push Notification Dispatchers
```env
# Supavisor Transaction Pooler URI (PORT 6543)
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### For Direct Schema Migrations (DDL Only - Sub-phase 1.1)
```env
# Direct Session Connection URI (PORT 5432)
# NOTE: Used solely by DB admins executing CREATE INDEX CONCURRENTLY
DIRECT_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

---

## 4. Mobile Client Zero-Leak Verification

In [`delchat/lib/supabase.ts`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/lib/supabase.ts):
- Single shared client instance exported across all screens and components.
- Persistent session storage through `@react-native-async-storage/async-storage`.
- `autoRefreshToken: true` guarantees tokens are transparently renewed without creating new HTTP sessions.
- `detectSessionInUrl: false` disables web-only window location polling on native iOS/Android devices.
