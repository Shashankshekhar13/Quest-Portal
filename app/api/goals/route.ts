import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/goals?sheet_id=xxx — List all goals for a goal sheet
 * POST /api/goals — Create a new goal
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = request.nextUrl.searchParams.get("sheet_id");
  if (!sheetId) {
    return NextResponse.json({ error: "sheet_id is required" }, { status: 400 });
  }

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals: goals ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Verify sheet belongs to user and is editable
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("id, status, employee_id")
    .eq("id", body.sheet_id)
    .single();

  if (!sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  if (sheet.employee_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sheet.status !== "draft" && sheet.status !== "rework") {
    return NextResponse.json(
      { error: "Cannot add goals to a submitted or approved sheet" },
      { status: 400 }
    );
  }

  // Check goal count limit
  const { count } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .eq("sheet_id", body.sheet_id);

  if ((count ?? 0) >= 8) {
    return NextResponse.json(
      { error: "Maximum 8 goals allowed per sheet." },
      { status: 400 }
    );
  }

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      sheet_id: body.sheet_id,
      thrust_area: body.thrust_area || null,
      title: body.title || "New Goal",
      description: body.description || null,
      uom: body.uom || null,
      target: body.target ?? null,
      target_date: body.target_date || null,
      weightage: body.weightage ?? null,
      is_shared: body.is_shared ?? false,
      shared_from_goal_id: body.shared_from_goal_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}
