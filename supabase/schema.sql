-- =============================================================
-- AtomQuest Goal Portal – Complete Database Schema
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       text UNIQUE NOT NULL,
  name        text,
  role        text NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
  manager_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  department  text,
  created_at  timestamptz DEFAULT now()
);

-- 2. goal_sheets
CREATE TABLE IF NOT EXISTS goal_sheets (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_year   int DEFAULT 2026,
  status       text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted', 'approved', 'rework')),
  locked_at    timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- 3. goals
CREATE TABLE IF NOT EXISTS goals (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id           uuid NOT NULL REFERENCES goal_sheets(id) ON DELETE CASCADE,
  thrust_area        text,
  title              text NOT NULL,
  description        text,
  uom                text CHECK (uom IN ('min', 'max', 'timeline', 'zero')),
  target             numeric,
  target_date        date,
  weightage          int CHECK (weightage >= 10),
  is_shared          boolean DEFAULT false,
  shared_from_goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  status             text NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started', 'on_track', 'completed')),
  created_at         timestamptz DEFAULT now()
);

-- 4. checkins
CREATE TABLE IF NOT EXISTS checkins (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id             uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  quarter             text NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  actual_achievement  numeric,
  status              text CHECK (status IN ('not_started', 'on_track', 'completed')),
  manager_comment     text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- 5. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  table_name  text,
  record_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz DEFAULT now()
);

-- 6. cycles
CREATE TABLE IF NOT EXISTS cycles (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  phase      text NOT NULL CHECK (phase IN ('goal_setting', 'Q1', 'Q2', 'Q3', 'Q4')),
  opens_at   date,
  closes_at  date,
  is_active  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goal_sheets_employee ON goal_sheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_sheet ON goals(sheet_id);
CREATE INDEX IF NOT EXISTS idx_checkins_goal ON checkins(goal_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_cycles_active ON cycles(is_active) WHERE is_active = true;

-- 7. Triggers
-- Prevent direct edits to locked goals
CREATE OR REPLACE FUNCTION prevent_locked_goal_edits()
RETURNS TRIGGER AS $$
DECLARE
  sheet_locked timestamptz;
BEGIN
  SELECT locked_at INTO sheet_locked FROM goal_sheets WHERE id = NEW.sheet_id;
  IF sheet_locked IS NOT NULL THEN
    RAISE EXCEPTION 'Safety Net: Cannot edit a goal belonging to a locked goal sheet. Unlock the sheet first.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_goal_edits ON goals;
CREATE TRIGGER trg_prevent_locked_goal_edits
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION prevent_locked_goal_edits();
