import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/goal-sheets — Get current user's goal sheet for cycle_year 2026
 * POST /api/goal-sheets — Create a new draft goal sheet
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sheet, error } = await supabase
    .from("goal_sheets")
    .select("*")
    .eq("employee_id", user.id)
    .eq("cycle_year", 2026)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sheet });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if sheet already exists
  const { data: existing } = await supabase
    .from("goal_sheets")
    .select("id")
    .eq("employee_id", user.id)
    .eq("cycle_year", 2026)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Goal sheet already exists for this cycle" },
      { status: 409 }
    );
  }

  const { data: sheet, error } = await supabase
    .from("goal_sheets")
    .insert({
      employee_id: user.id,
      cycle_year: 2026,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sheet }, { status: 201 });
}
