// =============================================================
// AtomQuest Goal Portal – TypeScript Interfaces
// =============================================================

export type UserRole = "employee" | "manager" | "admin";
export type GoalSheetStatus = "draft" | "submitted" | "approved" | "rework";
export type UOM = "min" | "max" | "timeline" | "zero";
export type GoalStatus = "not_started" | "on_track" | "completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type CheckinStatus = "not_started" | "on_track" | "completed";
export type CyclePhase = "goal_setting" | "Q1" | "Q2" | "Q3" | "Q4";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  manager_id: string | null;
  department: string | null;
  created_at: string;
}

export interface GoalSheet {
  id: string;
  employee_id: string;
  cycle_year: number;
  status: GoalSheetStatus;
  locked_at: string | null;
  rework_reason: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  sheet_id: string;
  thrust_area: string | null;
  title: string;
  description: string | null;
  uom: UOM | null;
  target: number | null;
  target_date: string | null;
  weightage: number | null;
  is_shared: boolean;
  shared_from_goal_id: string | null;
  status: GoalStatus;
  created_at: string;
}

export interface Checkin {
  id: string;
  goal_id: string;
  quarter: Quarter;
  actual_achievement: number | null;
  completion_date: string | null;
  status: CheckinStatus | null;
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface Cycle {
  id: string;
  name: string;
  phase: CyclePhase;
  opens_at: string | null;
  closes_at: string | null;
  is_active: boolean;
}
