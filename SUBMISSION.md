# AtomQuest Goal Portal — Hackathon Submission 🚀

**Team / Project Name:** AtomQuest Goal Portal  
**Hackathon:** Atomberg Internal Hackathon 2026  

---

## 🔗 Live Links & Repository

- **Live Demo URL:** [https://atomquest-portal.vercel.app](https://atomquest-portal.vercel.app) *(Replace with your actual Vercel URL after deployment)*
- **GitHub Repository:** [https://github.com/Shashankshekhar13/Quest-Portal](https://github.com/Shashankshekhar13/Quest-Portal)

---

## 👥 Demo Credentials (Instant Login)

For the convenience of the judges, the login page features **1-Click Demo Login Cards**. You can also manually enter the credentials below:

| Role | Email | Password | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Employee** | `emp1@atomberg.com` | `password123` | Create goal sheets, submit quarterly check-ins, view live progress ring. |
| **Manager** | `manager@atomberg.com` | `password123` | Review team submissions, approve goals, add manager comments to check-ins. |
| **Admin / HR** | `admin@atomberg.com` | `password123` | Active cycle management, organization-wide completion dashboard, CSV exports, audit logs. |

---

## 🏛️ System Architecture

AtomQuest is built on a modern, decoupled serverless architecture designed for speed, security, and real-time reliability.

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

### Key Architectural Highlights:
1. **Frontend (Next.js 15 & Tailwind CSS):** Utilizes the App Router for seamless Server-Side Rendering (SSR) and optimized client-side interactivity. Styled with vanilla Tailwind CSS for a premium, responsive glassmorphism aesthetic.
2. **Hosting & Deployment (Vercel):** Deployed serverlessly on Vercel, providing automated branch previews, zero-config CI/CD, and blazing-fast edge routing.
3. **Backend & Database (Supabase / PostgreSQL):**
   - **Authentication:** Supabase Auth manages secure sessions with Role-Based Access Control (RBAC) verified at middleware and API layers.
   - **Data Integrity:** Strict PL/pgSQL database triggers act as an un-bypassable safety net, preventing direct mutations to approved/locked goal sheets.
   - **Centralized Services:** Pure utility modules (`lib/scoring.ts` and `lib/audit.ts`) guarantee consistent score calculations and tamper-evident audit trails across all endpoints.

---

## 🛠️ Verification & Smoke Test Results

During our final end-to-end verification, the platform passed all critical workflows:

- [x] **Path 1 (Employee):** Logged in as Employee -> Created Goal Sheet -> Added 5 Goals -> Verified weightage exactly equals 100% -> Submitted successfully.
- [x] **Path 2 (Manager):** Logged in as Manager -> Reviewed employee goals -> Adjusted targets -> Approved sheet -> Switched to Check-ins tab and added evaluation comments.
- [x] **Path 3 (Admin):** Logged in as Admin -> Navigated to Completion Dashboard -> Verified live status distribution chart -> Exported both Completion and Achievement CSV reports -> Audited system logs successfully.

---

## 📥 Deployment Instructions

To deploy your own instance of AtomQuest:

1. Clone the repository.
2. Create a Supabase project and execute `supabase/schema.sql` and `supabase/migrations/003_audit_trigger.sql`.
3. Set up your `.env.local` (or Vercel Environment Variables):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. Run `npx vercel --prod` to deploy directly to Vercel.
