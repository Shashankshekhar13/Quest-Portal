import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/goal-sheets/[id]/submit — Submit a goal sheet for approval.
 * Runs all validation server-side:
 *   1. Total weightage must equal exactly 100%
 *   2. Each goal weightage >= 10
 *   3. Max 8 goals
 *   4. All required fields filled
 *   5. Sheet must be in draft or rework status
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

  // Verify sheet ownership and status
  const { data: sheet, error: sheetError } = await supabase
    .from("goal_sheets")
    .select("*")
    .eq("id", id)
    .eq("employee_id", user.id)
    .single();

  if (sheetError || !sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  if (sheet.status !== "draft" && sheet.status !== "rework") {
    return NextResponse.json(
      { error: "Only draft or rework sheets can be submitted" },
      { status: 400 }
    );
  }

  // Fetch all goals for this sheet
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("sheet_id", id);

  if (goalsError) {
    return NextResponse.json({ error: goalsError.message }, { status: 500 });
  }

  if (!goals || goals.length === 0) {
    return NextResponse.json(
      { error: "Cannot submit an empty goal sheet. Add at least one goal." },
      { status: 400 }
    );
  }

  // Validation 3: Max 8 goals
  if (goals.length > 8) {
    return NextResponse.json(
      { error: "Maximum 8 goals allowed per sheet." },
      { status: 400 }
    );
  }

  const errors: string[] = [];

  // Validation 4: Required fields
  goals.forEach((goal, index) => {
    if (!goal.title?.trim()) {
      errors.push(`Goal ${index + 1}: Title is required.`);
    }
    if (!goal.uom) {
      errors.push(`Goal ${index + 1}: Unit of Measurement is required.`);
    }
    if (goal.uom === "timeline") {
      if (!goal.target_date) {
        errors.push(`Goal ${index + 1}: Target date is required for timeline goals.`);
      }
    } else {
      if (goal.target === null || goal.target === undefined) {
        errors.push(`Goal ${index + 1}: Target value is required.`);
      }
    }
    if (goal.weightage === null || goal.weightage === undefined) {
      errors.push(`Goal ${index + 1}: Weightage is required.`);
    }
  });

  // Validation 2: Individual weightage >= 10
  goals.forEach((goal, index) => {
    if (goal.weightage !== null && goal.weightage < 10) {
      errors.push(
        `Goal ${index + 1}: Weightage must be at least 10% (currently ${goal.weightage}%).`
      );
    }
  });

  // Validation 1: Total weightage must be exactly 100
  const totalWeightage = goals.reduce(
    (sum: number, g: { weightage: number | null }) => sum + (g.weightage ?? 0),
    0
  );
  if (totalWeightage !== 100) {
    errors.push(
      `Total weightage must be exactly 100% (currently ${totalWeightage}%).`
    );
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") , errors }, { status: 400 });
  }

  // All validations passed — submit
  const { error: updateError } = await supabase
    .from("goal_sheets")
    .update({ status: "submitted", rework_reason: null })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Goal sheet submitted for approval." });
}
