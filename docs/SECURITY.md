# 🔒 PRECISION + PERSONALITY LAB - SECURITY, AUTHENTICATION & COMPLIANCE OVERVIEW  
### *Version 2.4 - Production Deployment Configuration*

---

## 🧭 INTRODUCTION

Security is a **first-class citizen** in the Precision + Personality Lab (PPL) ecosystem.  
This document outlines how **authentication**, **authorization**, **auditability**, and **data protection** are enforced across the full-stack architecture.

The system is designed to meet both **research transparency** and **enterprise-grade data isolation** standards.

---

## 🧩 SECURITY PRINCIPLES

| Principle | Implementation | Purpose |
|------------|----------------|----------|
| **Zero Trust by Default** | Session tokens validated on every route | No implicit trust; every call authenticated |
| **Immutable Audit Trail** | Central `audit_logs` table | Forensically traceable record of all events |
| **Row-Level Security (RLS)** | Postgres row filters tied to `auth.uid()` | Prevents cross-user data access |
| **Least Privilege Access** | Scoped service roles + API keys | Minimal surface for credential misuse |
| **Encryption in Transit** | HTTPS + Supabase TLS enforcement | Ensures data confidentiality |
| **Secure Secrets Handling** | `.env` + Vercel Secret Store | Runtime-only exposure for API credentials |

---

## 🧱 AUTHENTICATION STACK

### 🔐 Supabase Auth (JWT Session Model)

PPL uses **Supabase’s managed authentication** system, which provides:
- Secure JWT-based sessions
- Email/password sign-in and verification flows
- Automatic token refresh (every 45 minutes)
- Auth events (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`) broadcast to the client

**Implementation:**

```tsx
const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
```

**Storage Model:**
- JWT tokens stored in secure HTTP-only cookies.
- Session validated server-side on all API routes.

---

## ⚙️ AUTHORIZATION FLOW

| Stage | Mechanism | Description |
|--------|------------|--------------|
| 1️⃣ Request Received | Middleware (`withRateLimit`) | Validate IP quota + block unauthorized flood attempts |
| 2️⃣ Session Validation | `supabase.auth.getUser()` | Ensure active session, reject expired tokens |
| 3️⃣ RLS Enforcement | Postgres Policy | Filter all rows by `auth.uid()` |
| 4️⃣ Audit Event | `logAuditEvent()` | Log authentication success/failure |
| 5️⃣ Response | Secure JSON payload | No sensitive data returned |

---

## 🧩 ROW-LEVEL SECURITY (RLS) POLICIES

Each Supabase table enforces RLS policies to isolate user data. Below are examples of key implementations.

### `experiments` Table

```sql
alter table experiments enable row level security;

create policy "Users can manage their experiments"
on experiments
for all
using (auth.uid() = user_id);
```

### `analytics_summaries` Table

```sql
create policy "Users can view their analytics"
on analytics_summaries
for select
using (auth.uid() = user_id);
```

### `audit_logs` Table

```sql
create policy "Users can view their own logs"
on audit_logs
for select
using (auth.uid() = user_id);
```

**Outcome:** Each user can only read, update, or delete their own records, ensuring total tenant isolation.

---

## 🧠 AUDIT & TRACEABILITY

Every meaningful system event (auth, calibration, experiment, realtime, analytics) is logged immutably.

| Category | Event Types | Example Payload |
|-----------|--------------|----------------|
| Authentication | sign_in, sign_up, sign_out, auth_error | `{ email: "user@lab.ai" }` |
| Calibration | calibration_started, completed, failed | `{ calibration_id, user_id }` |
| Experiment | experiment_created, experiment_generated, experiment_deleted | `{ prompt, latency_ms }` |
| Realtime | realtime_connected, disconnected, error | `{ connection_id }` |
| Analytics | analytics_computed, analytics_updated | `{ calibration_id, metrics }` |

**Implementation:**

```tsx
export async function logAuditEvent(event_type, event_data = {}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    event_type,
    event_data,
  });
}
```

**Characteristics:**
- JSONB payloads for flexible data structures  
- Immutable entries (no update/delete)  
- Timestamped automatically via `created_at DEFAULT now()`  

---

## 🧰 MIDDLEWARE SECURITY LAYER

### 🧩 1. Rate Limiter (`withRateLimit`)
- Enforces per-IP quotas and burst protection (30 requests/min).  
- Uses Redis/Supabase KV for distributed counters.  
- Returns **429 Too Many Requests** on abuse.

### 🧩 2. Error Handler (`withErrorHandler`)
- Wraps all API routes in a secure try/catch.  
- Prevents internal stack trace leaks.  
- Returns JSON error responses in the format:

```json
{ "status": "error", "message": "Invalid request." }
```

### 🧩 3. Telemetry Middleware (`withTelemetry`)
- Logs every request (path, latency, user_id, status).  
- Stores in `system_metrics` for performance auditing.  
- Enables pattern detection for security anomalies.  

---

## 🔒 ENVIRONMENT & SECRET MANAGEMENT

### `.env.local` Template

```bash
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
OPENAI_API_KEY=sk-xxxxxx
LLM_MODEL=gpt-4o-mini
```

**Secret Handling:**
- All secrets stored in Vercel Secret Storage or `.env.production` (excluded from Git).  
- No keys exposed to client-side bundle.  
- Environment isolation for staging vs production.  

---

## 🧩 SECURITY INTEGRATION: DATABASE TABLES

| Table | Security Mechanisms |
|--------|----------------------|
| `users` | Managed by Supabase Auth |
| `calibrations` | RLS + Audit Events |
| `experiments` | RLS + Auth Validation + Audit |
| `analytics_summaries` | RLS + Auth Validation |
| `audit_logs` | Read-only immutable |
| `system_metrics` | Write-only telemetry source |

---

## 🧱 INFRASTRUCTURE & NETWORK SECURITY

| Area | Implementation |
|------|----------------|
| **Deployment** | Dockerized, reproducible environment |
| **Hosting** | Vercel Edge Runtime + HTTPS enforced |
| **Database** | Supabase (TLS 1.3, encryption in transit) |
| **Realtime Channels** | Authenticated Postgres listener sessions |
| **Storage** | Supabase object storage with signed URLs |
| **Network Isolation** | Only API routes accessible publicly |

---

## 🧾 COMPLIANCE & BEST PRACTICES

| Category | Implementation |
|-----------|----------------|
| **Data Privacy** | User-level data isolation; no shared logs |
| **Logging Retention** | Immutable logs retained 1 year (configurable) |
| **Access Control** | No anonymous write permissions |
| **Encryption** | TLS 1.3 enforced end-to-end |
| **GDPR Readiness** | All personal data exportable and deletable |
| **OpenAI API Calls** | Server-only with key rotation support |

---

## 🧩 INCIDENT RESPONSE & RECOVERY

| Event | Detection | Response |
|--------|------------|-----------|
| **Auth Breach Attempt** | Rate limit spikes + telemetry anomalies | Auto-block offending IP |
| **Data Leakage Risk** | Supabase audit flags | Rotate keys + revoke sessions |
| **Realtime Channel Flood** | Connection threshold breach | Drop session + alert system |
| **LLM API Failure** | Error middleware catch | Retry with exponential backoff |

---

## 🧠 SECURITY SUMMARY

| Layer | Safeguard | Status |
|--------|------------|--------|
| **Auth** | JWT + RLS + Audit | ✅ Enforced |
| **API** | Rate-limit + Telemetry | ✅ Active |
| **DB** | Supabase RLS | ✅ Verified |
| **Middleware** | Error isolation | ✅ Hardened |
| **Transport** | HTTPS + TLS | ✅ Default |
| **Secrets** | Encrypted runtime vars | ✅ Secured |
| **Deployment** | Dockerized + CI/CD locked | ✅ Complete |

---

## 🏁 CONCLUSION

The **Precision + Personality Lab** implements a multi-layer security model ensuring:

- User data isolation  
- Traceable auditability  
- Resilient middleware protections  
- Encrypted, authenticated LLM workflows  

Security is not an afterthought, it’s embedded in the architecture.

For further schema-level diagrams, see `/docs/ARCHITECTURE.md`.  