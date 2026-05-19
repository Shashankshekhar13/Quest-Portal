import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/goal-sheets/[id]/rework — Manager requests rework on a goal sheet.
 * Requires a reason in the request body.
 */

export async function POST(
  request: Request,
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

  // Parse body
  const body = await request.json();
  const reason = body?.reason?.trim();

  if (!reason) {
    return NextResponse.json(
      { error: "Rework reason is required. Please explain what needs to be changed." },
      { status: 400 }
    );
  }

  // Verify sheet exists and is submitted
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("status")
    .eq("id", id)
    .single();

  if (!sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  if (sheet.status !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted sheets can be sent back for rework" },
      { status: 400 }
    );
  }

  // Update to rework
  const { error: updateError } = await supabase
    .from("goal_sheets")
    .update({
      status: "rework",
      rework_reason: reason,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Write audit log
  await logAudit({
    supabase,
    userId: user.id,
    action: "goal_rework_requested",
    tableName: "goal_sheets",
    recordId: id,
    newValue: { status: "rework", reason },
  });

  return NextResponse.json({ success: true, message: "Rework request sent." });
}
