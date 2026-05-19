# AtomQuest Goal Portal

Atomberg's goal-setting and performance tracking platform for employees and managers.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Form Validation | React Hook Form + Zod |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9 (or pnpm / yarn)
- A **Supabase** project ([create one free](https://supabase.com/dashboard))

### Step 1 — Clone & Install

```bash
git clone <your-repo-url>
cd atomquest-goal-portal
npm install
```

### Step 2 — Configure Environment Variables

Edit `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 3 — Create the Database Schema

Run `supabase/schema.sql` in the Supabase SQL Editor.

### Step 4 — Seed Sample Data

Run `supabase/seed.sql` in the Supabase SQL Editor.

### Step 5 — Create Auth Users

In the Supabase dashboard **Authentication** section, create these users with password `password123`:

| Email | Password |
|---|---|
| admin@atomberg.com | password123 |
| manager@atomberg.com | password123 |
| emp1@atomberg.com | password123 |
| emp2@atomberg.com | password123 |
| emp3@atomberg.com | password123 |

**Important:** The auth user IDs must match the IDs in the `users` table from seed.sql.

### Step 6 — Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Employee | emp1@atomberg.com | password123 |
| Manager | manager@atomberg.com | password123 |
| Admin | admin@atomberg.com | password123 |

---

## Project Structure

```
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                        # Landing page
│   ├── login/page.tsx                  # Login with demo credentials
│   ├── auth/callback/route.ts          # OAuth/email callback
│   └── dashboard/
│       ├── employee/
│       │   ├── layout.tsx              # Role guard (employee)
│       │   └── page.tsx                # Employee dashboard
│       ├── manager/
│       │   ├── layout.tsx              # Role guard (manager)
│       │   └── page.tsx                # Manager dashboard
│       └── admin/
│           ├── layout.tsx              # Role guard (admin)
│           └── page.tsx                # Admin dashboard
├── components/
│   └── Navbar.tsx                      # Shared nav with role-based links
├── lib/
│   ├── auth.ts                         # getCurrentUser, requireRole, getManagerTeam
│   ├── types.ts                        # TypeScript interfaces
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client
│       └── server.ts                   # Server Supabase client
├── middleware.ts                       # Auth + role-based route protection
├── supabase/
│   ├── schema.sql                      # Database schema (6 tables)
│   └── seed.sql                        # Sample data
└── .env.local                          # Supabase credentials
```

---

## License

Private — Atomberg Technologies.
