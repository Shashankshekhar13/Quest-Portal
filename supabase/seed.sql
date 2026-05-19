-- =============================================================
-- AtomQuest Goal Portal – Seed Data
-- =============================================================

-- Admin
INSERT INTO users (id, email, name, role, department)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@atomberg.com',
  'Admin User',
  'admin',
  'Engineering'
) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name, role = EXCLUDED.role;

-- Manager
INSERT INTO users (id, email, name, role, department)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'manager@atomberg.com',
  'Manager User',
  'manager',
  'Engineering'
) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name, role = EXCLUDED.role;

-- Employee 1
INSERT INTO users (id, email, name, role, manager_id, department)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'emp1@atomberg.com',
  'Employee One',
  'employee',
  'b0000000-0000-0000-0000-000000000001',
  'Engineering'
) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name, role = EXCLUDED.role, manager_id = EXCLUDED.manager_id;

-- Employee 2
INSERT INTO users (id, email, name, role, manager_id, department)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'emp2@atomberg.com',
  'Employee Two',
  'employee',
  'b0000000-0000-0000-0000-000000000001',
  'Engineering'
) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name, role = EXCLUDED.role, manager_id = EXCLUDED.manager_id;

-- Employee 3
INSERT INTO users (id, email, name, role, manager_id, department)
VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'emp3@atomberg.com',
  'Employee Three',
  'employee',
  'b0000000-0000-0000-0000-000000000001',
  'Engineering'
) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name, role = EXCLUDED.role, manager_id = EXCLUDED.manager_id;

-- Active cycle
INSERT INTO cycles (id, name, phase, opens_at, closes_at, is_active)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'FY 2026-27',
  'goal_setting',
  '2026-04-01',
  '2026-05-31',
  true
) ON CONFLICT DO NOTHING;
