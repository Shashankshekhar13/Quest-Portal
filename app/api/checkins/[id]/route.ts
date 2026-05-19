import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

/**
 * PUT /api/checkins/[id] — Update a check-in (manager comment, status, actual)
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

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.manager_comment !== undefined) updateData.manager_comment = body.manager_comment;
  if (body.actual_achievement !== undefined) updateData.actual_achievement = body.actual_achievement;
  if (body.completion_date !== undefined) updateData.completion_date = body.completion_date;
  if (body.status !== undefined) updateData.status = body.status;

  const { data: checkin, error } = await supabase
    .from("checkins")
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
    action: "checkin_updated",
    tableName: "checkins",
    recordId: id,
    newValue: updateData
  });

  return NextResponse.json({ checkin });
}
