import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

import { computeScore } from "@/lib/scoring";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return new Response("Forbidden", { status: 403 });

  // Name, Dept, Goal, Target, Q1 Actual, Q1 Score, Q2 Actual, Q2 Score, Q3 Actual, Q3 Score, Q4 Actual, Q4 Score
  const headers = [
    "Name", "Department", "Goal Title", "Target", 
    "Q1 Actual", "Q1 Score", 
    "Q2 Actual", "Q2 Score", 
    "Q3 Actual", "Q3 Score", 
    "Q4 Actual", "Q4 Score"
  ];
  
  const rows = [];

  const { data: users } = await supabase.from("users").select("id, name, department").eq("role", "employee");
  
  for (const emp of (users || [])) {
    const { data: sheet } = await supabase.from("goal_sheets").select("id, status").eq("employee_id", emp.id).eq("cycle_year", 2026).eq("status", "approved").maybeSingle();
    
    if (sheet) {
      const { data: goals } = await supabase.from("goals").select("*").eq("sheet_id", sheet.id);
      
      if (goals && goals.length > 0) {
        const goalIds = goals.map(g => g.id);
        const { data: checkins } = await supabase.from("checkins").select("*").in("goal_id", goalIds);
        
        for (const g of goals) {
          const gCheckins = (checkins || []).filter(c => c.goal_id === g.id);
          const qMap: Record<string, any> = { "Q1": null, "Q2": null, "Q3": null, "Q4": null };
          gCheckins.forEach(c => { qMap[c.quarter] = c; });

          const row = [
            `"${emp.name || ""}"`,
            `"${emp.department || ""}"`,
            `"${g.title.replace(/"/g, '""')}"`, // escape quotes for CSV
            g.uom === "timeline" ? `"${g.target_date}"` : `"${g.target || ""}"`
          ];

          ["Q1", "Q2", "Q3", "Q4"].forEach(q => {
            const c = qMap[q];
            if (!c) {
              row.push('""', '""');
            } else {
              const actual = g.uom === "timeline" ? c.completion_date : c.actual_achievement;
              const actualNum = c.actual_achievement !== null ? Number(c.actual_achievement) : null;
              const score = computeScore(g.uom, g.target, actualNum, g.target_date, c.completion_date);
              row.push(`"${actual || ""}"`, `"${score !== null ? score.toFixed(1) + "%" : ""}"`);
            }
          });

          rows.push(row);
        }
      }
    }
  }

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=achievement_report.csv"
    }
  });
}
