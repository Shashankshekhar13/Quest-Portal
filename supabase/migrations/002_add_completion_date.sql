-- Migration: Add completion_date to checkins for timeline goals
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS completion_date date;
