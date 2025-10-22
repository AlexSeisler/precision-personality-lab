# 🔄 WORKFLOW SEQUENCE DIAGRAM - EXPERIMENT LIFECYCLE + OBSERVABILITY FLOW  
### *Precision + Personality Lab (v2.4 Production)*

---

## 🧠 PURPOSE

This document captures **the complete runtime behavior** of the Precision + Personality Lab system -  
from **user calibration** through **prompt generation**, **metric computation**, and **data export** -  
including all background processes such as **telemetry**, **audit logs**, and **realtime updates**.

---

## ⚙️ PHASE MAP OVERVIEW

```mermaid
flowchart LR
A["User Interaction Layer"] --> B["Next.js Frontend"]
B --> C["API Layer (/api/generate)"]
C --> D["Middleware Chain"]
D --> E["OpenAI GPT-4o"]
D --> F["(Supabase Postgres)"]
F --> G["Realtime Channels"]
F --> H["Analytics Summaries"]
F --> I["Audit Logs"]
G --> J["Dashboard Sync"]
B --> K["User Export Actions"]
K --> L["Export Service"]
L --> I["Audit Logs"]
```

---

## 🧩 1️⃣ CALIBRATION SEQUENCE (Interactive Phase)

```mermaid
sequenceDiagram
    participant User
    participant UI as "Calibration UI (Next.js)"
    participant API as "/api/calibration"
    participant DB as "Supabase (calibrations)"
    participant Logs as "Audit Logs"

    User->>UI: Start calibration quiz
    UI->>API: POST calibration answers
    API->>DB: INSERT calibration record (param ranges)
    DB-->>API: Return calibration_id + parameter summary
    API->>Logs: INSERT event 'calibration_completed'
    API-->>UI: Return calibration summary JSON
    UI->>User: Display success + “Proceed to Experiment” button
```

---

## 🧩 2️⃣ EXPERIMENT GENERATION SEQUENCE (Core LLM Phase)

```mermaid
sequenceDiagram
    participant User
    participant UI as "Experiment Studio"
    participant API as "/api/generate"
    participant OpenAI as "GPT-4o Endpoint"
    participant DB as "Supabase (experiments)"
    participant Metrics as "Analytics Upsert"
    participant Logs as "Audit Logs"
    participant RT as "Realtime Broadcast"

    User->>UI: Submit prompt + parameter set
    UI->>API: POST {prompt, calibration_id, numResponses}
    API->>Logs: Log event 'llm_request_started'
    API->>OpenAI: Send multiple requests (Promise.allSettled)
    OpenAI-->>API: Return responses + tokens
    API->>API: Compute creativity, coherence, structure, completeness
    API->>DB: INSERT experiment (responses + metrics)
    API->>Metrics: UPSERT analytics_summaries entry
    API->>Logs: INSERT 'experiment_generated'
    DB-->>RT: Broadcast INSERT event
    RT-->>UI: Update Dashboard live
    API-->>UI: Return structured results
    UI->>User: Render motion-animated response cards
```

---

## 🧩 3️⃣ ANALYTICS PIPELINE FLOW

```mermaid
flowchart TD
A["New Experiment Inserted"] --> B["Trigger analytics_summaries.upsert()"]
B --> C["Aggregate metrics across user_id + calibration_id"]
C --> D["Update analytics_summaries JSON field"]
D --> E["Realtime Emit → analytics_refresh"]
E --> F["Dashboard Metrics Store Updates"]
F --> G["Recharts Re-render with Motion Transition"]
```

---

## 🧩 4️⃣ REALTIME SYSTEM SYNCHRONIZATION

```mermaid
sequenceDiagram
    participant UI
    participant Supabase as "Supabase Realtime"
    participant Experiments
    participant Dashboard
    participant Logs

    Experiments->>Supabase: INSERT trigger (new record)
    Supabase-->>UI: Emit JSON payload via WebSocket
    UI->>Dashboard: Re-render with new card
    UI->>Logs: Log 'realtime_update_received'
```

---

## 🧩 5️⃣ EXPORT & DATA PERSISTENCE WORKFLOW

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant API as "/api/exports"
    participant DB as "experiment_exports"
    participant Logs as "Audit Logs"
    participant Blob as "Supabase Storage"

    User->>Dashboard: Click “Export Experiments”
    Dashboard->>API: POST {format: 'csv', selectedIds: [..]}
    API->>DB: INSERT export job record
    API->>Blob: Generate file (CSV/JSON)
    Blob-->>API: Return public URL
    API->>Logs: INSERT event 'export_completed'
    API-->>Dashboard: Return download link
    Dashboard->>User: Display success toast + download button
```

---

## 🧩 6️⃣ TELEMETRY & PERFORMANCE OBSERVABILITY

```mermaid
flowchart TB
A["API Route Request"] --> B["withTelemetry Middleware"]
B --> C["Start Timer + Log Metadata"]
C --> D["Execute Core Handler"]
D --> E["Stop Timer"]
E --> F["Write to system_metrics"]
F --> G["Optional UI Visual Feedback"]
```

---

## 🧩 7️⃣ AUDIT LOGGING PIPELINE

```mermaid
flowchart TD
A["User Action / System Event"] --> B["Audit Log Insert"]
B --> C["Supabase audit_logs Table"]
C --> D["Realtime Console View"]
D --> E["Post-Analysis / Export"]
```

---

## 🧩 8️⃣ COMPLETE END-TO-END EVENT FLOW

```mermaid
flowchart TD
subgraph Frontend
A["User"] --> B["Next.js UI (Zustand Stores)"]
B --> C["API / Calibration"]
C --> D["API / Generate"]
D --> E["API / Exports"]
end

subgraph Backend
C --> F["(Calibrations Table)"]
D --> G["(Experiments Table)"]
G --> H["(Analytics Summaries)"]
E --> I["(Experiment Exports)"]
D --> J["(Audit Logs)"]
E --> J
D --> K["(System Metrics)"]
end

subgraph Observability
J --> L["Telemetry Dashboard"]
K --> L
end

F --> G
G --> H
H --> B
G --> B
J --> B
```

---

## 🧠 10️⃣ EXCEPTION HANDLING PATHS

```mermaid
flowchart TD
A["API Route Error"] --> B["withErrorHandler()"]
B --> C["Return JSON Response { success:false, error }"]
B --> D["Insert into audit_logs"]
D --> E["Alert UI Toast"]
E --> F["User Feedback + Retry"]
```

---

## 🧾 11️⃣ REPRODUCIBILITY CHAIN

```mermaid
flowchart LR
A["Calibration ID"] --> B["Experiment Parameters"]
B --> C["Experiment Response"]
C --> D["Analytics Summary"]
D --> E["Audit Log Entry"]
E --> F["Export Package"]
```

---

## 🧱 12️⃣ SUMMARY - DATA + OBSERVABILITY INTEGRATION

| Layer | Primary Action | Observability Trace |
|--------|----------------|----------------------|
| Calibration | Create parameter range | calibration_completed |
| Experiment | Generate response | experiment_generated, llm_request_started |
| Analytics | Aggregate metrics | analytics_updated |
| Realtime | Sync dashboard | realtime_update_received |
| Telemetry | Record latency | system_metrics |
| Audit | Persist event logs | audit_logs |
| Export | Deliver user data | export_completed |

---

## 🧩 13️⃣ DESIGN INSIGHTS

- **Full Observability Stack** - every request path logs telemetry + audit simultaneously.  
- **Causal Event Chain** - allows replaying full experiment lifecycle from raw calibration to analytics summary.  
- **Realtime UX Feedback** - immediate dashboard updates create "live lab" interactivity.  
- **Error Containment** - unified `jsonResponse()` ensures consistent frontend error rendering.  
- **Time-Based Debugging** - correlation IDs link events across tables and logs.  

---

## 🏁 CONCLUSION

This workflow defines the **Precision + Personality Lab’s operational backbone**,  
a precisely instrumented architecture ensuring every model action, metric computation, and export is **traceable, auditable, and reproducible**.

> “Every experiment tells a story, and every story leaves a measurable trace.”

