-- Migration: Add rework_reason to goal_sheets
ALTER TABLE goal_sheets ADD COLUMN IF NOT EXISTS rework_reason text;
