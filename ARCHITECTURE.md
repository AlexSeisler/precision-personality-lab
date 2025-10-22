# 🧩 PRECISION + PERSONALITY LAB - SYSTEM ARCHITECTURE OVERVIEW  
### *Version 2.4 - Production-Ready Infrastructure*

---

## 🧠 INTRODUCTION

The **Precision + Personality Lab (PPL)** is a full-stack **LLM experimentation console** designed for transparency, control, and creativity.  
It provides researchers and developers with the ability to **run, analyze, and visualize** large-language-model generations through a **calibrated and measurable workflow**.

This document details the **core architecture**, **data pipelines**, and **modular integrations** that power the system from end to end.

---

## 🚀 ARCHITECTURAL STACK

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend Framework** | **Next.js 15.5.6 (App Router)** | SSR + API routes + client-side interactivity |
| **State Management** | **Zustand** | Lightweight reactive global stores for UI and metrics |
| **Styling Framework** | **TailwindCSS + shadcn/ui + Framer Motion** | Consistent UI with fluid animations |
| **Backend / Database** | **Supabase (PostgreSQL + Auth + Realtime)** | Persistence, authentication, analytics, and audit logging |
| **LLM Integration** | **OpenAI GPT-4o Mini API** | Real-time text generation engine |
| **Middleware Layer** | **Custom Next.js Middlewares** | Error handling, telemetry, and rate limiting |
| **Deployment** | **Docker + Vercel (Edge Runtime)** | Scalable, secure production infrastructure |

---

## 🧭 SYSTEM OVERVIEW

```
[ User Interface ]
↓
[ Calibration Flow ]
↓
[ Experiment Studio ]
↓
[ /api/generate Route ]
↓
[ OpenAI LLM Response ]
↓
[ Supabase Persistence ]
↓
[ Realtime & Analytics Engine ]
↓
[ Dashboard + Metrics Visualization ]
```

---

## ⚙️ CORE MODULES

### 1️⃣ **Frontend Layer (Next.js + Zustand)**

- **Next.js 15 App Router** handles SSR and API endpoints.
- Client components manage calibration, experiment input, and real-time updates.
- **Zustand stores**:
  - `useExperimentStore` – prompt + response lifecycle.
  - `useCalibrationStore` – parameter ranges.
  - `useMetricsStore` – analytics aggregation.
  - `useUIStore` – toasts, modals, and realtime indicators.

**Goal:** responsive, reactive, SSR-safe UX with minimal client overhead.

---

### 2️⃣ **Backend API Layer**

#### `/api/generate` - LLM Pipeline Endpoint

Handles full experiment lifecycle:

1. **Validate Auth Session** - via Supabase JWT.  
2. **Fetch Latest Calibration** - user-specific temperature/top_p ranges.  
3. **Call OpenAI GPT-4o API** - secure server-side fetch.  
4. **Compute Metrics** - creativity, coherence, structure, completeness, lexical diversity, latency.  
5. **Persist Results** - into `experiments` and `analytics_summaries`.  
6. **Log Event** - to `audit_logs` and `system_metrics`.

All requests pass through middleware for **telemetry**, **rate limiting**, and **error handling**.

---

### 3️⃣ **Middleware Chain**

```tsx
export const POST = withErrorHandler(
  withTelemetry(
    withRateLimit(generateHandler)
  )
);
```

| Middleware | Purpose |
|-------------|----------|
| `withErrorHandler` | Standardized JSON responses + backend audit logging. |
| `withTelemetry` | Logs endpoint latency, user, and success/failure to system_metrics. |
| `withRateLimit` | IP-based throttling using Redis/Supabase KV to prevent abuse. |

---

### 4️⃣ **Realtime Engine**

Supabase Realtime Channels subscribe to table events:

- `calibrations`
- `experiments`

Listeners in `/lib/hooks/use-realtime.ts` trigger:

- `realtime_connected`, `realtime_disconnected`, `realtime_error` events.

Toasts and visual status updates appear in the UI header.

Auto-resubscription logic handles network interruptions.

**Result:** all dashboards remain live-updating without reload.

---

### 5️⃣ **Analytics Engine**

Defined in `/store/metrics-store.ts`.

Computes and caches:

- `avgCreativity`
- `avgCoherence`
- `avgStructure`
- `avgCompleteness`
- `avgLatency`
- `avgResponseLength`
- `avgConsistency`

Pushes results to Supabase `analytics_summaries`.

Triggers recomputation via realtime experiment inserts.

---

### 6️⃣ **Audit + Telemetry Layer**

| Table | Function |
|--------|-----------|
| `audit_logs` | Immutable event trail (auth, calibration, experiment, realtime, analytics). |
| `system_metrics` | Endpoint telemetry (latency, route, user_id, status_code). |

All logs are per-user scoped with enforced RLS policies:

```sql
create policy "Users can view their logs"
on audit_logs for select
using (auth.uid() = user_id);
```

---

## 🧮 DATABASE SCHEMA SUMMARY

| Table | Key Columns | Purpose |
|--------|--------------|----------|
| `users (Supabase Auth)` | `id`, `email` | Auth base |
| `calibrations` | `id`, `user_id`, `parameters`, `created_at` | Stores parameter profiles |
| `experiments` | `id`, `calibration_id`, `prompt`, `responses`, `metrics` | Primary LLM generation records |
| `analytics_summaries` | `id`, `calibration_id`, `metrics_summary` | Cached averages for dashboards |
| `audit_logs` | `id`, `user_id`, `event_type`, `event_data` | Full audit trail |
| `system_metrics` | `id`, `route`, `latency_ms`, `status_code` | API telemetry |

**Relationships:**

```
users (1) ───< calibrations (1) ───< experiments (∞)
experiments (∞) ───> analytics_summaries (1)
users (1) ───< audit_logs (∞)
users (1) ───< system_metrics (∞)
```

---

## 🧩 MERMAID SYSTEM DIAGRAM

```mermaid
graph TD
A[User] --> B[Next.js Frontend]
B --> C[/api/generate]
C --> D[OpenAI GPT-4o]
C --> E[Supabase DB]
E --> F[(experiments)]
E --> G[(calibrations)]
E --> H[(analytics_summaries)]
E --> I[(audit_logs)]
E --> J[(system_metrics)]
B --> K[Realtime Engine]
K --> F
F --> L[Metrics Store]
L --> M[Dashboard Visualization]
```

---

## 🔒 SECURITY & ISOLATION

- **JWT Session Validation** for all API routes.  
- **Row Level Security (RLS)** on all tables using `auth.uid()`.  
- **Audit-Backed Auth Events:** every sign_in, sign_out, and auth_error logged.  
- **Rate Limit Middleware** enforces fairness per IP / user.  
- **Telemetry Chain** ensures all performance data stored and reviewable.  

---

## 🧰 DEPLOYMENT & SCALABILITY

| Component | Strategy |
|------------|-----------|
| Dockerized Builds | Isolated reproducible environment for local + cloud runs. |
| Vercel Edge Network | Edge-optimized SSR with global caching. |
| Supabase Cloud | Elastic scaling for Realtime and Postgres. |
| OpenAI API | Dynamic streaming-ready endpoint for text generation. |

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
LLM_MODEL=gpt-4o-mini
```

---

## 📈 PERFORMANCE METRICS (PRODUCTION)

| Metric | Result | Note |
|---------|---------|------|
| Realtime Latency | < 200ms | average event propagation |
| API Response | < 2.5s | average LLM call latency |
| Analytics Recomputation | < 100ms | cached summary updates |
| Hydration Time | ~190ms | post-build measurement |
| Bundle Size | ~820KB | reduced via lazy motion imports |

---

## 🧭 DESIGN PRINCIPLES

- **Transparency:** every system event auditable.  
- **Modularity:** each layer (auth, experiment, analytics) standalone and replaceable.  
- **Performance:** optimized for low-latency and SSR safety.  
- **User-Centric:** calibrated experience mirrors human creativity tuning.  
- **Scalability:** dockerized deployment ready for enterprise extension.  

---

## 🏁 CONCLUSION

The **Precision + Personality Lab** architecture represents a production-ready research environment that merges real-time analytics, secure data pipelines, and creative experimentation.

It is designed to scale from a single-user research console to an enterprise-grade generative AI analytics platform.

> From prompt to performance, a transparent, measurable, and creative LLM laboratory.

