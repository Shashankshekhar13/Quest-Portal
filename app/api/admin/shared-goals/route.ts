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
  const { title, thrust_area, uom, target, employee_ids } = body;

  if (!title || !employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const results = { success: 0, failed: 0 };

  for (const empId of employee_ids) {
    // Find or create sheet
    let { data: sheet } = await supabase
      .from("goal_sheets")
      .select("id")
      .eq("employee_id", empId)
      .eq("cycle_year", 2026)
      .maybeSingle();

    if (!sheet) {
      const { data: newSheet, error: newSheetErr } = await supabase
        .from("goal_sheets")
        .insert([{ employee_id: empId, cycle_year: 2026, status: "draft" }])
        .select()
        .single();
      
      if (newSheetErr) {
        results.failed++;
        continue;
      }
      sheet = newSheet;
    }

    if (!sheet) {
      results.failed++;
      continue;
    }

    // Insert shared goal
    const { error: goalErr } = await supabase
      .from("goals")
      .insert([{
        sheet_id: sheet.id,
        title,
        thrust_area: thrust_area || null,
        uom: uom || null,
        target: target || null,
        is_shared: true,
        weightage: null // Let employee set weightage
      }]);

    if (goalErr) {
      results.failed++;
    } else {
      results.success++;
    }
  }

  // Write to audit_logs
  await logAudit({
    supabase,
    userId: user.id,
    action: "shared_goal_created",
    tableName: "goals",
    newValue: { title, employee_count: employee_ids.length, successes: results.success }
  });

  return NextResponse.json({ success: true, results });
}
