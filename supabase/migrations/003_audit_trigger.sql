-- Migration: 003_audit_trigger.sql
-- Create a safety net trigger to prevent direct edits to locked goals.

CREATE OR REPLACE FUNCTION prevent_locked_goal_edits()
RETURNS TRIGGER AS $$
DECLARE
  sheet_locked timestamptz;
BEGIN
  -- Retrieve the locked_at timestamp from the parent goal sheet
  SELECT locked_at INTO sheet_locked FROM goal_sheets WHERE id = NEW.sheet_id;
  
  -- If it is locked, prevent the update
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
