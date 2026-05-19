import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { sheetId } = body;

  if (!sheetId) return NextResponse.json({ error: "Missing sheetId" }, { status: 400 });

  const { data: sheet, error: fetchErr } = await supabase
    .from("goal_sheets")
    .select("*")
    .eq("id", sheetId)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const { data: updatedSheet, error } = await supabase
    .from("goal_sheets")
    .update({ status: "draft", locked_at: null })
    .eq("id", sheetId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write to audit_logs
  await logAudit({
    supabase,
    userId: user.id,
    action: "admin_unlock",
    tableName: "goal_sheets",
    recordId: sheetId,
    oldValue: { status: sheet.status, locked_at: sheet.locked_at },
    newValue: { status: "draft", locked_at: null }
  });

  return NextResponse.json({ success: true, sheet: updatedSheet });
}
