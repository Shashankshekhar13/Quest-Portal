import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

/**
 * PUT /api/goals/[id] — Update a goal
 * DELETE /api/goals/[id] — Delete a goal
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Verify goal exists and sheet is editable by this user
  const { data: goal } = await supabase
    .from("goals")
    .select("id, sheet_id, goal_sheets(employee_id, status)")
    .eq("id", id)
    .single();

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const sheet = goal.goal_sheets as unknown as { employee_id: string; status: string };

  // Allow manager edits (they won't have employee_id match)
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isManager = currentUser?.role === "manager" || currentUser?.role === "admin";
  const isOwner = sheet.employee_id === user.id;

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isOwner && sheet.status !== "draft" && sheet.status !== "rework") {
    return NextResponse.json(
      { error: "Cannot edit goals on a submitted or approved sheet" },
      { status: 400 }
    );
  }

  // Build update object — only include fields that are provided
  const updateData: Record<string, unknown> = {};
  if (body.thrust_area !== undefined) updateData.thrust_area = body.thrust_area;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.uom !== undefined) updateData.uom = body.uom;
  if (body.target !== undefined) updateData.target = body.target;
  if (body.target_date !== undefined) updateData.target_date = body.target_date;
  if (body.weightage !== undefined) updateData.weightage = body.weightage;

  const { data: updated, error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    supabase,
    userId: user.id,
    action: currentUser?.role === "admin" ? "admin_edit" : "goal_updated",
    tableName: "goals",
    recordId: id,
    newValue: updateData
  });

  return NextResponse.json({ goal: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: goal } = await supabase
    .from("goals")
    .select("id, sheet_id, goal_sheets(employee_id, status)")
    .eq("id", id)
    .single();

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const sheet = goal.goal_sheets as unknown as { employee_id: string; status: string };

  if (sheet.employee_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sheet.status !== "draft" && sheet.status !== "rework") {
    return NextResponse.json(
      { error: "Cannot delete goals on a submitted or approved sheet" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
