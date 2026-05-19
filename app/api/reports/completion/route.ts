import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const { data: users } = await supabase.from("users").select("id, name, department").eq("role", "employee");
  
  // Headers for CSV
  const headers = ["Name", "Department", "Manager", "Sheet Status", "Q1 Submitted", "Q2 Submitted", "Q3 Submitted", "Q4 Submitted"];
  const rows = [];

  for (const emp of (users || [])) {
    // Get manager
    const { data: managerData } = await supabase.from("users").select("manager_id").eq("id", emp.id).single();
    let managerName = "—";
    if (managerData?.manager_id) {
      const { data: m } = await supabase.from("users").select("name").eq("id", managerData.manager_id).single();
      if (m) managerName = m.name || "—";
    }

    // Get sheet
    const { data: sheet } = await supabase.from("goal_sheets").select("id, status").eq("employee_id", emp.id).eq("cycle_year", 2026).maybeSingle();
    let status = "Not Started";
    let q1 = "–", q2 = "–", q3 = "–", q4 = "–";

    if (sheet) {
      status = sheet.status;
      if (status === "approved") {
        // Get goals
        const { data: goals } = await supabase.from("goals").select("id").eq("sheet_id", sheet.id);
        const goalIds = (goals || []).map(g => g.id);
        
        if (goalIds.length > 0) {
          // Get checkins
          const { data: checkins } = await supabase.from("checkins").select("quarter").in("goal_id", goalIds);
          const qs = new Set((checkins || []).map(c => c.quarter));
          if (qs.has("Q1")) q1 = "✓";
          if (qs.has("Q2")) q2 = "✓";
          if (qs.has("Q3")) q3 = "✓";
          if (qs.has("Q4")) q4 = "✓";
        }
      }
    }

    rows.push([
      `"${emp.name || ""}"`,
      `"${emp.department || ""}"`,
      `"${managerName}"`,
      status,
      q1, q2, q3, q4
    ]);
  }

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=completion_report.csv"
    }
  });
}
