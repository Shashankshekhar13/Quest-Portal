# 🏛️ AtomQuest Goal Portal — Hackathon Submission

Welcome to the official submission of **AtomQuest Goal Portal**, a premium corporate alignment platform custom-built for the **Atomberg Technologies Performance Hackathon**. AtomQuest is designed to solve employee goal alignment, manager reviews, and HR performance tracking on a highly resilient, serverless tech stack.

---

## 🔗 Live Links & Code Repository

* **Live Demo URL:** [https://atomquest-portal-sandy-seven.vercel.app](https://atomquest-portal-sandy-seven.vercel.app)
* **GitHub Repository:** [https://github.com/Shashankshekhar13/Quest-Portal](https://github.com/Shashankshekhar13/Quest-Portal)

---

## 👥 Demo Credentials (1-Click Instant Login)

For the convenience of the judges, our login page integrates **1-Click Demo Login Cards** that instantly populate credentials and authenticate the user based on their chosen role. You can also manually enter these credentials:

| Role | Email | Password | Primary Key Capabilities |
| :--- | :--- | :--- | :--- |
| 🧑‍💻 **Employee** | `emp1@atomberg.com` | `password123` | Create goal sheets, align goals with company strategic objectives, track progress with dynamic progress rings, submit quarterly check-ins. |
| 🧑‍💼 **Manager** | `manager@atomberg.com` | `password123` | Access direct reports' goal sheets, edit employee targets, reject for rework, approve and lock goal sheets, provide quarterly evaluation feedback. |
| 👑 **Admin / HR** | `admin@atomberg.com` | `password123` | Set active review cycles, monitor organization-wide goal completion rates, export CSV completion reports, audit security logs. |

---

## 🏛️ System Architecture

AtomQuest is designed as a decoupled, edge-optimized serverless application integrating Next.js 15, Vercel, and Supabase. 

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js 15 (App Router)             │
│   ┌────────────────────────┐   ┌────────────────────┐   │
│   │   Client Components    │   │ Server Components  │   │
│   │ (Tailwind, Lucide, UI) │   │  (API, Auth, SSR)  │   │
│   └───────────┬────────────┘   └─────────┬──────────┘   │
└───────────────┼──────────────────────────┼──────────────┘
                │                          │               
                │ HTTPS / REST             │ Supabase Client / RPC
                ▼                          ▼               
┌─────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                   │
│      (Global CDN, Edge Functions, Automated CI/CD)      │
└───────────────────────────┬─────────────────────────────┘
                            │                              
                            │ Secure Connection            
                            ▼                              
┌─────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                  │
│   ┌────────────────────────┐   ┌────────────────────┐   │
│   │     Supabase Auth      │   │  Database Triggers │   │
│   │    (RLS & JWT RBAC)    │   │ (Goal Lock Safety) │   │
│   └───────────┬────────────┘   └─────────┬──────────┘   │
│               │                          │              
│               ▼                          ▼              
│   ┌─────────────────────────────────────────────────┐   │
│   │                 Core Tables                     │   │
│   │  (users, goal_sheets, goals, checkins, cycles)  │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Strengths:
1. **Frontend Layer (Next.js 15 & Tailwind CSS):** Leverages Server-Side Rendering (SSR) for initial loads and reactive Client Components for rich states. Styled with a premium glassmorphic theme and sleek micro-animations.
2. **Edge Route Protection (`middleware.ts`):** Custom middleware intercepts requests at Vercel's edge network, immediately validating JWT auth tokens and routing users according to their RBAC classifications (`employee`, `manager`, `admin`).
3. **Resilient Database Schema (Supabase/PostgreSQL):**
   * **PL/pgSQL Triggers:** Implements trigger-based validations (like preventing updates to goal sheets once they are approved and locked by managers).
   * **Synchronization (`seed_auth.sql`):** Provides a clean database script that syncs Supabase auth credentials with database tables to completely eliminate account setup mismatches.

---

## 🛠️ Verification & Smoke Test Results

During our final end-to-end audit, the platform successfully passed all core performance tests:

* [x] **Path 1 (Employee Workflow):** Authenticated instantly -> Created a new goal sheet -> Added goals totaling exactly 100% weightage -> Submitted successfully -> Verified goal sheet state transitioned to `submitted`.
* [x] **Path 2 (Manager Evaluation Loop):** Viewed team dashboard -> Selected Employee One -> Edited goal parameters -> Rejected for rework with comment feedback -> Employee re-submitted -> Approved goal sheet -> Switched to check-in tab to add quarterly reviews.
* [x] **Path 3 (HR & Administration):** Navigated to Completion Dashboard -> Monitored real-time completion charts -> Changed active cycles dynamically -> Exported Achievement and Completion CSV sheets -> Inspected audit logs successfully.

---

## 📥 Deployment Instructions

To run your own instance of AtomQuest:

1. Clone the repository.
2. Create a free project in the [Supabase Dashboard](https://supabase.com).
3. Open the **SQL Editor** in Supabase and execute the SQL scripts in this exact order:
   * **Step 1:** Run [supabase/schema.sql](supabase/schema.sql) (Initializes tables, DDL constraints, and DB triggers).
   * **Step 2:** Run [supabase/seed.sql](supabase/seed.sql) (Initializes corporate user profiles and Cycles).
   * **Step 3:** Run [supabase/seed_auth.sql](supabase/seed_auth.sql) (Creates auth accounts with matching static UUIDs).
   * **Step 4:** Run RLS bypass commands (to allow clean client SDK queries):
     ```sql
     ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.goal_sheets DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.checkins DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.cycles DISABLE ROW LEVEL SECURITY;
     ```
4. Set up your Vercel or local environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
5. Deploy instantly by running `npx vercel --prod`.
