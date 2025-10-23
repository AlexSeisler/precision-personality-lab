# 🧠 Precision + Personality Lab  
### *“Master your model’s mind - control the precision, calibrate the creativity.”*  
[**🌐 Live Demo → precision-personality-lab.vercel.app**](https://precision-personality-r4a18rpqc-alex-seislers-projects.vercel.app/)  

---

## 🚀 Overview  

**Precision + Personality Lab** is an interactive, research-grade **LLM experimentation platform** that bridges engineering precision with human creativity.  

It enables researchers, engineers, and creatives to **calibrate, visualize, and compare** how large-language-model parameters (temperature, top-p, penalties, etc.) affect output quality, coherence, and personality, all in real time.

Built with **Next.js 15**, **Supabase**, and **OpenAI GPT-4o**, the Lab provides a transparent and production-ready environment for **controlled prompt experimentation**, **data analytics**, and **model behavior insights**.

---

## 🧩 Core Features  

| Category | Description |
|-----------|--------------|
| 🎧️ **Calibration Engine** | Interactive quiz defines personalized LLM parameter ranges (temperature, top-p, penalties). |
| 💬 **Experiment Studio** | Run prompts, view multiple responses, compare metrics (creativity, coherence, structure, completeness). |
| 📊 **Metrics Dashboard** | View aggregated analytics, trends, and averages across all experiments. |
| 🔁 **Realtime Sync** | Live updates using Supabase Realtime (no refresh needed). |
| 📦 **Data Export** | One-click JSON/CSV export of experiment history and metrics summaries. |
| 🧠 **Audit & Telemetry** | Every action logged and traceable through `audit_logs` and `system_metrics`. |
| 🧮 **Production-Ready Architecture** | Dockerized, SSR-safe, type-strict, and integrated with CI/CD (Vercel + Supabase). |

---

## 🎗️ Architecture Overview  

```
Frontend (Next.js 15 + TypeScript)
├─→ /api/generate → OpenAI GPT-4o Inference
├─→ Supabase (Auth, DB, Realtime)
├─→ Zustand (State Management)
├─→ Recharts + Framer Motion (Visualization)
└─→ Middleware: Telemetry · Error-Handler · Rate-Limiter
```

### **Core Tech Stack**

| Layer | Technology |
|-------|-------------|
| Frontend Framework | Next.js 15 (App Router, SSR, Edge-Ready) |
| Backend & Database | Supabase (PostgreSQL + Auth + Realtime) |
| LLM Engine | OpenAI GPT-4o Mini |
| State Management | Zustand |
| UI Framework | TailwindCSS + shadcn/ui + Framer Motion |
| Deployment | Docker + Vercel (Edge Network) |
| Language | TypeScript (Strict Mode) |

---

## ⚙️ Quick Start  

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AlexSeisler/precision-personality-lab.git
cd precision-personality-lab
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment Variables
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
```

### 4️⃣ Run the Development Server
```bash
npm run dev
```
Visit http://localhost:3000

### 5️⃣ Build for Production
```bash
npm run build && npm run start
```

---

## 🧠 Feature Highlights  

### 🔬 Precision Meets Personality
- Calibrate your LLM using a guided interactive quiz.  
- Observe real-time changes in coherence and creativity metrics.  
- Save, discard, or export experiments anytime.  

### 📡 Realtime Intelligence
- Supabase Realtime streams new experiments and analytics directly to your dashboard.  

### 📈 Analytics & Metrics
- Compute averages across creativity, coherence, structure, completeness, and latency.  
- Visualized through Recharts with smooth motion transitions.  

### 🔐 Audit & Security
- Full Row-Level Security (RLS) enforcement.  
- Per-user isolation and JWT-based authentication.  
- Immutable `audit_logs` for all major system events.  

---

## 🧱 Directory Structure  

```
src/
├── app/
│   ├── api/ (generate, health)
│   ├── calibration/
│   ├── experiment/
│   ├── dashboard/
│   ├── metrics/
│   └── layout.tsx
├── components/
│   ├── auth/
│   ├── features/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── api/ (audit, calibrations, experiments, exports, middleware)
│   ├── auth/
│   ├── supabase/
│   └── utils/
├── store/
│   ├── calibration-store.ts
│   ├── experiment-store.ts
│   ├── metrics-store.ts
│   └── ui-store.ts
└── supabase/
    └── migrations/
```

---

## 🔒 Security & Compliance  

- **Authentication:** Supabase Auth (JWT Sessions)  
- **Data Protection:** PostgreSQL RLS + per-user scoping  
- **Audit Logging:** `audit_logs` table with correlation IDs  
- **Rate Limiting:** per-IP middleware  
- **Error Handling:** global structured JSON responses  
- **Telemetry:** `system_metrics` table for endpoint performance  

For deeper details, see `/docs/security.md`.

---

## 📊 Analytics & Telemetry  

| Table | Purpose |
|--------|----------|
| `experiments` | Stores all prompt results, parameters, and metrics |
| `calibrations` | Records user calibration profiles |
| `analytics_summaries` | Cached analytics per calibration |
| `audit_logs` | Immutable event trace |
| `system_metrics` | Performance telemetry and latency logs |

---

## 🧮 Developer Notes  

- Uses **Framer Motion Lazy Imports** to reduce bundle size and ensure SSR safety.  
- **Dockerfile** configured for portable, reproducible builds.  
- **Vercel Edge Deployment** verified with live Supabase connection.  
- **TypeScript Strict Mode** active across the codebase.  
- Full documentation available under `/docs`.  

## 📚 Documentation Overview

All project documentation is located in the `/docs` directory and follows a modular format:

| File                                                                 | Description                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| [ARCHITECTURE.md](/docs/ARCHITECTURE.md)                             | Full system architecture, module breakdown, and data flow. |
| [SECURITY.md](/docs/SECURITY.md)                                     | Security, authentication, and compliance mechanisms.       |
| [INTEGRATIONS.md](/docs/INTEGRATIONS.md)                             | Service integrations with Supabase, OpenAI, and Vercel.    |
| [DIAGRAMS/DATABASE-ERD.md](/docs/DIAGRAMS/DATABASE-ERD.md)           | Entity–Relationship Diagram (ERD) for the database schema. |
| [DIAGRAMS/SYSTEM-TOPOLOGY.md](/docs/DIAGRAMS/SYSTEM-TOPOLOGY.md)     | System topology, data flow, and infrastructure layout.     |
| [DIAGRAMS/WORKFLOW-SEQUENCE.md](/docs/DIAGRAMS/WORKFLOW-SEQUENCE.md) | Workflow and observability sequence diagrams.              |
| [LICENSE.md](/docs/LICENSE.md)                                       | Project licensing information and usage terms.             |
| [TimeSheet.png](/docs/TimeSheet.png)                                 | Time tracking and execution overview visual.               |

📘 Each file is written for **clarity and audit readiness**, suitable for **technical assessments** or **case study reviews**.

---

## 🖯️ Roadmap  

| Version | Goal |
|----------|------|
| v2.5 | Integrate live streaming inference + token-by-token visualization |
| v3.0 | Add analytics dashboard + user-defined experiment sharing |
| v3.5 | Introduce RAG / memory modules for longitudinal calibration |
| v4.0 | Enterprise portal + multi-tenant analytics layer |


---

## 🗾️ License  

© 2025 Alex Seisler  
Released under the **MIT License** - see LICENSE for details.  

---

## 🤝 Contributing  

Contributions are welcome!  
Please open a pull request or issue for any feature requests, optimizations, or documentation improvements.  

---

## 💬 Credits  

Built by **Alex Seisler**  
Co-developed and optimized with **System Architect** and **DevBot (Custom Agents)**  
Infrastructure by **Supabase**, **Vercel**, and **OpenAI**  

> “Every slider tells a story about how AI decides its next word.”  
> *Precision + Personality Lab*

