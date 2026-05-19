import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/goal-sheets/[id]/approve — Manager approves a goal sheet.
 * Re-validates weightage sums to 100%, sets status='approved', locked_at=now().
 */

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify manager role
  const { data: managerUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (managerUser?.role !== "manager" && managerUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify sheet exists and is submitted
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("*, users!goal_sheets_employee_id_fkey(manager_id)")
    .eq("id", id)
    .single();

  if (!sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  if (sheet.status !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted sheets can be approved" },
      { status: 400 }
    );
  }

  // Fetch goals and re-validate weightage
  const { data: goals } = await supabase
    .from("goals")
    .select("weightage")
    .eq("sheet_id", id);

  const totalWeightage = (goals ?? []).reduce(
    (sum: number, g: { weightage: number | null }) => sum + (g.weightage ?? 0),
    0
  );

  if (totalWeightage !== 100) {
    return NextResponse.json(
      { error: `Cannot approve: total weightage is ${totalWeightage}%, must be exactly 100%.` },
      { status: 400 }
    );
  }

  // Approve
  const { error: updateError } = await supabase
    .from("goal_sheets")
    .update({
      status: "approved",
      locked_at: new Date().toISOString(),
      rework_reason: null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAudit({
    supabase,
    userId: user.id,
    action: "goal_approved",
    tableName: "goal_sheets",
    recordId: id,
    newValue: { status: "approved", approved_by: user.id }
  });

  return NextResponse.json({ success: true, message: "Goal sheet approved." });
}
