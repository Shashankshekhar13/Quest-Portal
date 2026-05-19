"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GoalSheet, Goal, Checkin, Cycle } from "@/lib/types";
import { Loader2, CalendarCheck, Save, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { computeScore, computeWeightedScore } from "@/lib/scoring";

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

const QUARTERS: { id: Quarter; label: string; period: string }[] = [
  { id: "Q1", label: "Q1", period: "April - June (Check-in: July)" },
  { id: "Q2", label: "Q2", period: "July - Sept (Check-in: October)" },
  { id: "Q3", label: "Q3", period: "Oct - Dec (Check-in: January)" },
  { id: "Q4", label: "Q4", period: "Jan - March (Check-in: April)" },
];

const UOM_LABELS: Record<string, string> = {
  min: "Higher is better", max: "Lower is better", timeline: "Date-based", zero: "Zero = Success",
};

interface GoalWithCheckin extends Goal {
  checkin?: {
    id?: string;
    actual_achievement: string;
    completion_date: string;
    status: string;
  };
}

// Using computeScore from lib/scoring

export default function EmployeeCheckinsPage() {
  const supabase = createClient();
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [goals, setGoals] = useState<GoalWithCheckin[]>([]);
  const [activeTab, setActiveTab] = useState<Quarter>("Q1");
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async (quarterToFetch: Quarter) => {
    setLoading(true);
    
    // Fetch active cycle
    const { data: cycles } = await supabase.from("cycles").select("*").eq("is_active", true);
    let currentCycle: Cycle | null = null;
    if (cycles && cycles.length > 0) {
      currentCycle = cycles[0] as Cycle;
      setActiveCycle(currentCycle);
    }

    // Determine initial tab if this is the first load
    const qToUse = quarterToFetch;

    // Fetch user sheet
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sheetData } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", user.id)
      .eq("cycle_year", 2026)
      .maybeSingle();

    if (sheetData && sheetData.status === "approved") {
      setSheet(sheetData as GoalSheet);

      // Fetch goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("sheet_id", sheetData.id)
        .order("created_at");

      // Fetch checkins for the quarter
      const goalIds = (goalsData || []).map(g => g.id);
      let checkinsMap: Record<string, Checkin> = {};
      
      if (goalIds.length > 0) {
        const { data: checkinsData } = await supabase
          .from("checkins")
          .select("*")
          .in("goal_id", goalIds)
          .eq("quarter", qToUse);

        (checkinsData || []).forEach(c => {
          checkinsMap[c.goal_id] = c as Checkin;
        });
      }

      // Merge goals and checkins
      const mergedGoals = (goalsData || []).map((g: Goal) => {
        const c = checkinsMap[g.id];
        return {
          ...g,
          checkin: {
            id: c?.id,
            actual_achievement: c?.actual_achievement !== null && c?.actual_achievement !== undefined ? String(c.actual_achievement) : "",
            completion_date: c?.completion_date || "",
            status: c?.status || "not_started"
          }
        };
      });

      setGoals(mergedGoals);
    } else {
      setSheet(sheetData as GoalSheet | null);
    }
    
    setActiveTab(qToUse);
    setLoading(false);
  }, [supabase]);

  // Initial load
  useEffect(() => {
    // Try to guess active quarter based on current month (0-indexed)
    const month = new Date().getMonth();
    let defaultQ: Quarter = "Q1";
    if (month >= 6 && month <= 8) defaultQ = "Q1"; // July-Sept checkin window for Q1 is typically July
    else if (month >= 9 && month <= 11) defaultQ = "Q2";
    else if (month >= 0 && month <= 2) defaultQ = "Q3";
    else if (month >= 3 && month <= 5) defaultQ = "Q4";

    fetchData(defaultQ);
  }, [fetchData]);

  const handleTabChange = (q: Quarter) => {
    setActiveTab(q);
    fetchData(q);
  };

  const updateCheckin = (goalId: string, field: string, value: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        checkin: {
          ...g.checkin!,
          [field]: value
        }
      };
    }));
  };

  const saveProgress = async () => {
    if (!sheet) return;
    setSaving(true);
    
    const payload = goals.map(g => ({
      id: g.checkin?.id,
      goal_id: g.id,
      actual_achievement: g.checkin?.actual_achievement ? Number(g.checkin.actual_achievement) : null,
      completion_date: g.checkin?.completion_date || null,
      status: g.checkin?.status || "not_started"
    }));

    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheet_id: sheet.id,
        quarter: activeTab,
        checkins: payload
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast("success", "Progress saved successfully.");
      fetchData(activeTab); // refresh to get new IDs
    } else {
      showToast("error", data.error || "Failed to save progress.");
    }
    setSaving(false);
  };

  // Compute Overall Weighted Score
  const scoredGoals = goals.map(g => {
    const actualNum = g.checkin?.actual_achievement ? Number(g.checkin.actual_achievement) : null;
    return {
      weightage: g.weightage,
      score: computeScore(g.uom, g.target, actualNum, g.target_date, g.checkin?.completion_date) || 0 // Treat unentered as 0 for strict tracking
    };
  });
  const overallProgress = computeWeightedScore(scoredGoals);
  const progressColor = overallProgress >= 70 ? "text-emerald-600" : overallProgress >= 40 ? "text-amber-600" : "text-red-600";

  // Check if window is open
  const now = new Date();
  let windowOpen = false;
  if (activeCycle && activeCycle.phase === activeTab) {
    const opensAt = activeCycle.opens_at ? new Date(activeCycle.opens_at) : null;
    const closesAt = activeCycle.closes_at ? new Date(activeCycle.closes_at) : null;
    if (closesAt) closesAt.setDate(closesAt.getDate() + 1); // include full day

    if ((!opensAt || now >= opensAt) && (!closesAt || now <= closesAt)) {
      windowOpen = true;
    }
  }

  if (loading && goals.length === 0) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  if (!sheet || sheet.status !== "approved") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <div className="p-4 bg-gray-100 rounded-2xl inline-block"><Lock className="h-10 w-10 text-gray-400" /></div>
        <h1 className="text-2xl font-bold text-gray-900">Check-ins Locked</h1>
        <p className="text-gray-500">You can only access quarterly check-ins after your goal sheet has been approved by your manager.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {!windowOpen && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Check-in window closed</p>
            <p className="text-sm text-amber-700 mt-1">The check-in window for {activeTab} is not currently active. You can view your saved data, but cannot make changes. Contact Admin to enable.</p>
          </div>
        </div>
      )}

      {/* Header & Overall Score */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-brand-600" /> Quarterly Check-ins
          </h1>
          <p className="text-gray-500 mt-1">Track your progress and update achievements for FY 2026-27.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Overall Progress ({activeTab})</p>
          <p className={`text-4xl font-black mt-1 ${progressColor}`}>
            {overallProgress.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {QUARTERS.map(q => (
          <button
            key={q.id}
            onClick={() => handleTabChange(q.id)}
            className={`px-5 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === q.id 
                ? "bg-brand-600 text-white shadow-md" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {q.label} <span className={`text-xs font-normal ml-1 ${activeTab === q.id ? "text-brand-100" : "text-gray-400"}`}>({q.period})</span>
          </button>
        ))}
      </div>

      {/* Goals Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
           <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Goal</th>
                <th className="px-4 py-4 text-center">Weight</th>
                <th className="px-4 py-4 text-center">Target</th>
                <th className="px-4 py-4 text-center">Actual Achievement</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goals.map((g, idx) => {
                const actualNum = g.checkin?.actual_achievement ? Number(g.checkin.actual_achievement) : null;
                const s = computeScore(g.uom, g.target, actualNum, g.target_date, g.checkin?.completion_date);
                const scoreStr = s === null ? "— %" : `${s.toFixed(1)}%`;
                
                return (
                  <tr key={g.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded mt-0.5">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{g.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{g.thrust_area}</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{UOM_LABELS[g.uom || ""] || g.uom}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center font-medium text-gray-700">{g.weightage}%</td>
                    <td className="px-4 py-5 text-center text-gray-600 font-medium">
                      {g.uom === "timeline" ? g.target_date : g.target}
                    </td>
                    <td className="px-4 py-5">
                      {g.uom === "timeline" ? (
                        <input 
                          type="date"
                          disabled={!windowOpen}
                          value={g.checkin?.completion_date || ""}
                          onChange={(e) => updateCheckin(g.id, "completion_date", e.target.value)}
                          className="w-full max-w-[160px] mx-auto block px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      ) : (
                        <input 
                          type="number"
                          disabled={!windowOpen}
                          placeholder="Enter actual..."
                          value={g.checkin?.actual_achievement || ""}
                          onChange={(e) => updateCheckin(g.id, "actual_achievement", e.target.value)}
                          className="w-full max-w-[120px] mx-auto block px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 text-center focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <select
                        disabled={!windowOpen}
                        value={g.checkin?.status || "not_started"}
                        onChange={(e) => updateCheckin(g.id, "status", e.target.value)}
                        className="w-full max-w-[140px] mx-auto block px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="on_track">On Track</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${
                        s === null ? "bg-gray-100 text-gray-500" :
                        s >= 100 ? "bg-emerald-100 text-emerald-700" :
                        s >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>
                        {scoreStr}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <button
          onClick={saveProgress}
          disabled={!windowOpen || saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Progress
        </button>
      </div>
    </div>
  );
}
