import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = request.nextUrl.searchParams.get("sheet_id");
  const quarter = request.nextUrl.searchParams.get("quarter");

  if (!sheetId) {
    return NextResponse.json({ error: "sheet_id is required" }, { status: 400 });
  }

  // Verify sheet belongs to user
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("employee_id, status")
    .eq("id", sheetId)
    .single();

  if (!sheet || sheet.employee_id !== user.id) {
    return NextResponse.json({ error: "Goal sheet not found or unauthorized" }, { status: 403 });
  }

  // Fetch goals to get goal_ids
  const { data: goals } = await supabase
    .from("goals")
    .select("id")
    .eq("sheet_id", sheetId);

  if (!goals || goals.length === 0) {
    return NextResponse.json({ checkins: [] });
  }

  const goalIds = goals.map(g => g.id);

  let query = supabase.from("checkins").select("*").in("goal_id", goalIds);
  if (quarter) {
    query = query.eq("quarter", quarter);
  }

  const { data: checkins, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkins: checkins ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sheet_id, quarter, checkins } = body;

  if (!sheet_id || !quarter || !Array.isArray(checkins)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify sheet belongs to user and is approved
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("employee_id, status")
    .eq("id", sheet_id)
    .single();

  if (!sheet || sheet.employee_id !== user.id) {
    return NextResponse.json({ error: "Goal sheet not found or unauthorized" }, { status: 403 });
  }

  if (sheet.status !== "approved") {
    return NextResponse.json({ error: "Check-ins can only be submitted for approved goal sheets" }, { status: 400 });
  }

  // Validate active cycle
  const { data: activeCycles } = await supabase
    .from("cycles")
    .select("*")
    .eq("is_active", true);

  const activeCycle = activeCycles && activeCycles.length > 0 ? activeCycles[0] : null;

  if (!activeCycle || activeCycle.phase !== quarter) {
    return NextResponse.json({ error: "Check-in window is not active for this quarter" }, { status: 400 });
  }

  const now = new Date();
  const opensAt = activeCycle.opens_at ? new Date(activeCycle.opens_at) : null;
  const closesAt = activeCycle.closes_at ? new Date(activeCycle.closes_at) : null;

  // Add 1 day to closesAt to include the whole day
  if (closesAt) {
    closesAt.setDate(closesAt.getDate() + 1);
  }

  if ((opensAt && now < opensAt) || (closesAt && now > closesAt)) {
    return NextResponse.json({ error: "Check-in window is closed" }, { status: 400 });
  }

  // Get all valid goal IDs for this sheet
  const { data: goals } = await supabase
    .from("goals")
    .select("id")
    .eq("sheet_id", sheet_id);
    
  const validGoalIds = new Set((goals || []).map(g => g.id));

  // Filter and prepare upsert records
  const upsertData = checkins
    .filter((c: any) => validGoalIds.has(c.goal_id))
    .map((c: any) => ({
      id: c.id || undefined, // Use existing ID to trigger update, or undefined for new
      goal_id: c.goal_id,
      quarter,
      actual_achievement: c.actual_achievement ?? null,
      completion_date: c.completion_date || null,
      status: c.status || null,
      updated_at: new Date().toISOString()
    }));

  if (upsertData.length === 0) {
    return NextResponse.json({ success: true, checkins: [] });
  }

  const { data: result, error } = await supabase
    .from("checkins")
    .upsert(upsertData, { onConflict: "id" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log audit
  await logAudit({
    supabase,
    userId: user.id,
    action: "checkin_updated",
    tableName: "checkins",
    newValue: { quarter, count: result?.length }
  });

  return NextResponse.json({ success: true, checkins: result });
}
