# 🏛️ AtomQuest Goal Portal — Hackathon Edition

Welcome to **AtomQuest Goal Portal**, a premium, decoupled, serverless corporate alignment platform built specifically for **Atomberg's** performance management ecosystem. AtomQuest bridges the gap between organizational strategic thrust areas and employee execution, facilitating structured goal-setting, manager-employee check-in loops, and administrative completion intelligence.

---

## 🔗 Live Deployments & Live Demo
* **Production Live Portal:** [https://atomquest-portal-sandy-seven.vercel.app](https://atomquest-portal-sandy-seven.vercel.app)
* **GitHub Repository:** [https://github.com/Shashankshekhar13/Quest-Portal](https://github.com/Shashankshekhar13/Quest-Portal)

---

## 👥 1-Click Demo Credentials
To allow judges to seamlessly explore all system capabilities without registering accounts, the login page features **Interactive 1-Click Demo Login Cards**. You can also log in manually with the following credentials (Password is always `password123`):

| Role | Email | Password | Primary Key Capabilities |
| :--- | :--- | :--- | :--- |
| 🧑‍💻 **Employee** | `emp1@atomberg.com` | `password123` | Create goal sheets, add goals aligned with company thrust areas, submit quarterly check-ins, view live goal progress rings. |
| 🧑‍💼 **Manager** | `manager@atomberg.com` | `password123` | Access team management dashboard, review goal sheets, submit revisions (rework), approve sheets, provide check-in feedback. |
| 👑 **Admin / HR** | `admin@atomberg.com` | `password123` | Set active review cycles, view completion charts, check audit logs, export CSV completion and achievement data. |

---

## 🛠️ Step-by-Step Installation & Database Setup
Setting up a database in Supabase for Next.js can be tricky due to RLS policies and UUID mismatches between auth and public profiles. Follow these simple steps to set up the workspace perfectly on your own remote or local database:

### 1️⃣ Clone & Install Dependencies
```bash
git clone https://github.com/Shashankshekhar13/Quest-Portal.git
cd Quest-Portal
npm install
```

### 2️⃣ Configure Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials. **Note:** Our platform features an *auto-formatting wrapper* that handles both full HTTPS URLs and bare Supabase Project IDs natively!
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_ref_or_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_private_key
```

### 3️⃣ Initialize the Database Schema (SQL Editor)
Go to your **Supabase Dashboard > SQL Editor > New Query**, and execute the script in [supabase/schema.sql](supabase/schema.sql) to create all core relational tables:
* `users`
* `goal_sheets`
* `goals`
* `checkins`
* `audit_logs`
* `cycles`

### 4️⃣ Seed Profile Data (SQL Editor)
Execute the script in [supabase/seed.sql](supabase/seed.sql) to populate standard employee profiles, reporting hierarchies, and active cycles.

### 5️⃣ Seed Auth Accounts & Synchronize IDs (SQL Editor)
Because Supabase Auth handles user credentials internally under the `auth` schema, creating accounts manually in the dashboard UI generates random IDs that mismatch the `users` profile table. 
* To fix this instantly, copy and run our specialized [supabase/seed_auth.sql](supabase/seed_auth.sql) script in the SQL Editor. 
* This script automatically creates the demo auth credentials with their matching static database UUIDs and hashes their passwords securely!

### 6️⃣ Disable Row Level Security (SQL Editor)
By default, remote Supabase instances block database queries from the Client SDK unless explicitly permitted by RLS policies. To allow the application to securely fetch profiles during the hackathon demo, execute this query in the SQL Editor:
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_sheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles DISABLE ROW LEVEL SECURITY;
```

### 7️⃣ Spin up the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and start exploring the portal!

---

## 🏛️ Decoupled Serverless System Architecture
AtomQuest features an advanced architecture designed for maximum performance, edge-optimized routing, and rigorous database constraints.

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

* **Frontend Layer**: Built using **Next.js 15** and styled with a customized premium glassmorphism system using **Tailwind CSS**. Features custom micro-animations and clean separation of client-state interfaces and server actions.
* **Middleware Guard (Edge Protection)**: Custom Next.js middleware interceptor (`middleware.ts`) automatically validates user role tokens at the network edge, performing immediate routing based on user classification (`employee`, `manager`, `admin`).
* **Backend Layer**: Driven by a highly secure PostgreSQL database on Supabase. Utilizes custom database-level **PL/pgSQL triggers** to enforce business-critical logic (such as locking goals from modifications once the sheet is approved).

---

## 🔍 Key Capabilities & Workflows

### 🧑‍💻 Employee: Structured Goal Setting & Progress Tracking
1. **Company thrust area alignment**: Add goals mapped to specific company objectives.
2. **Weightage safety gates**: System prevents submission if goal weightage totals do not equal exactly 100%.
3. **Goal Check-ins**: Submit achievements and track progress dynamically with reactive goal rings and animated counters.

### 🧑‍💼 Manager: Collaborative Approval & Reviews
1. **Interactive review queues**: View direct reports' goal sheets instantly.
2. **Goal editing & adjustment**: Review targets and make edits prior to approval.
3. **Interactive flow control**: Reject sheets with detailed comments (sending them back for "rework") or approve them to lock goal parameters.

### 👑 Admin / HR: Organization-wide Completion Intelligence
1. **Cycle orchestration**: Dynamically set active cycles and control review periods.
2. **Live Completion Dashboards**: Track completion statistics with charts.
3. **Data portability**: Export fully formatted Completion and Achievement CSV reports.
4. **Security Audits**: Real-time access to immutable audit log records.

---

## 🧪 Smoke Testing & Verification Checklist
The platform has been rigorously tested through end-to-end user journeys:
- [x] **Path 1 (Employee Creation to Submission)**: Sign in -> Add goals with weightages equaling 100% -> Submit -> Verify sheet status transitions to `submitted`.
- [x] **Path 2 (Manager Feedback Loop)**: Review direct reports -> Make target adjustments -> Reject (verify state: `rework`) -> Re-submit -> Approve (verify state: `approved` and goal properties lock).
- [x] **Path 3 (HR Dashboard Audits)**: Review completions -> Export system report -> Access audit table to verify tamper-proof logs.

---

## 📁 Project Structure
```
├── app/
│   ├── globals.css                     # Premium Glassmorphic styles
│   ├── layout.tsx                      # Root layout & context initializers
│   ├── page.tsx                        # High-impact landing page
│   ├── login/page.tsx                  # Interactive 1-click login screen
│   └── dashboard/
│       ├── employee/                   # Employee UI & goal-setting actions
│       ├── manager/                    # Manager queue & evaluation panel
│       └── admin/                      # HR metrics dashboard & cycle switches
├── components/
│   └── Navbar.tsx                      # Responsive role-aware navigation
├── lib/
│   ├── auth.ts                         # Server-side user identity providers
│   ├── scoring.ts                      # Score & weightage calculations
│   └── supabase/
│       ├── client.ts                   # Resilient browser client initializer
│       └── server.ts                   # Resilient server client initializer
├── middleware.ts                       # Edge-level route protection
├── supabase/
│   ├── schema.sql                      # DDL schema definition
│   ├── seed.sql                        # User profiles & active cycles
│   └── seed_auth.sql                   # Secure static Auth account creation
└── ARCHITECTURE.md                     # Design details and structural diagram
```

---

## 📜 License
Developed for the **Atomberg Technologies Performance Hackathon**. 
All Rights Reserved.
