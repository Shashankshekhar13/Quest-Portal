"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, GoalSheet } from "@/lib/types";
import { Users, FileText, CheckCircle, Clock, Eye, RotateCcw, Bell, CalendarCheck, Loader2 } from "lucide-react";

type Tab = "team" | "checkins";

interface TeamMember extends User {
  goalSheet?: GoalSheet | null;
}

interface CheckinRow {
  id: string;
  goal_id: string;
  quarter: string;
  actual_achievement: number | null;
  status: string | null;
  manager_comment: string | null;
  goal_title: string;
  goal_uom: string | null;
  goal_target: number | null;
  goal_target_date: string | null;
  employee_name: string;
  completion_date: string | null;
  _saving?: boolean;
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  draft: { label: "Not Started", cls: "bg-gray-100 text-gray-600" },
  submitted: { label: "Awaiting Review", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  rework: { label: "Rework Requested", cls: "bg-red-100 text-red-700" },
};

import { computeScore } from "@/lib/scoring";

export default function ManagerDashboardPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("team");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    if (userData) setCurrentUser(userData as User);

    const { data: members } = await supabase.from("users").select("*").eq("manager_id", authUser.id).order("name");
    const teamMembers: TeamMember[] = [];
    for (const m of (members ?? []) as User[]) {
      const { data: sheet } = await supabase.from("goal_sheets").select("*").eq("employee_id", m.id).eq("cycle_year", 2026).maybeSingle();
      teamMembers.push({ ...m, goalSheet: sheet as GoalSheet | null });
    }
    setTeam(teamMembers);
    setLoading(false);
  }, [supabase]);

  const fetchCheckins = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: members } = await supabase.from("users").select("id, name").eq("manager_id", authUser.id);
    if (!members) return;

    const rows: CheckinRow[] = [];
    for (const m of members) {
      const { data: sheets } = await supabase.from("goal_sheets").select("id").eq("employee_id", m.id).eq("cycle_year", 2026).eq("status", "approved");
      for (const s of (sheets ?? [])) {
        const { data: goals } = await supabase.from("goals").select("id, title, uom, target, target_date").eq("sheet_id", s.id);
        for (const g of (goals ?? [])) {
          const { data: ckins } = await supabase.from("checkins").select("*").eq("goal_id", g.id).order("quarter");
          if (ckins && ckins.length > 0) {
            for (const c of ckins) {
              rows.push({ ...c, goal_title: g.title, goal_uom: g.uom, goal_target: g.target, goal_target_date: g.target_date, employee_name: m.name ?? m.id });
            }
          }
        }
      }
    }
    setCheckins(rows);
  }, [supabase]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);
  useEffect(() => { if (tab === "checkins") fetchCheckins(); }, [tab, fetchCheckins]);

  const saveComment = async (checkinId: string, comment: string) => {
    setCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, _saving: true } : c));
    await fetch(`/api/checkins/${checkinId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_comment: comment }),
    });
    setCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, _saving: false, manager_comment: comment } : c));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  const submitted = team.filter(m => m.goalSheet?.status === "submitted").length;
  const approved = team.filter(m => m.goalSheet?.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard 📋</h1>
          <p className="text-gray-500 mt-1">Monitor your team's goal progress and review submissions.</p>
        </div>
        <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700">
          <span className="text-brand-600 font-bold">{submitted}</span> of {team.length} employees pending review
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        {[
          { label: "Team Members", value: String(team.length), icon: <Users className="h-5 w-5" />, color: "text-blue-600 bg-blue-100" },
          { label: "Pending Reviews", value: String(submitted), icon: <Clock className="h-5 w-5" />, color: "text-amber-600 bg-amber-100" },
          { label: "Approved", value: String(approved), icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-100" },
          { label: "Goal Sheets", value: String(team.filter(m => m.goalSheet).length), icon: <FileText className="h-5 w-5" />, color: "text-purple-600 bg-purple-100" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p></div>
              <div className={`p-2.5 rounded-lg ${s.color}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-4">
        <button onClick={() => setTab("team")} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "team" ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Users className="h-4 w-4 inline mr-1.5" />Team Overview
        </button>
        <button onClick={() => setTab("checkins")} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "checkins" ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <CalendarCheck className="h-4 w-4 inline mr-1.5" />Check-ins
        </button>
      </div>

      {tab === "team" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr><th className="px-6 py-3 text-left">Employee</th><th className="px-6 py-3 text-left">Department</th><th className="px-6 py-3 text-center">Goals</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Action</th></tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {team.map(m => {
                const sheetStatus = m.goalSheet?.status || "draft";
                const st = STATUS_STYLES[sheetStatus] ?? STATUS_STYLES.draft;
                
                const rowColor = 
                  sheetStatus === "submitted" ? "bg-amber-50/40 hover:bg-amber-50/80" :
                  sheetStatus === "approved" ? "bg-emerald-50/40 hover:bg-emerald-50/80" :
                  sheetStatus === "rework" ? "bg-red-50/40 hover:bg-red-50/80" :
                  "hover:bg-gray-50 transition-colors";

                return (
                  <tr key={m.id} className={rowColor}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{m.name?.charAt(0)?.toUpperCase() ?? "U"}</div><div><p className="font-medium text-gray-900">{m.name}</p><p className="text-xs text-gray-400">{m.email}</p></div></div></td>
                    <td className="px-6 py-4 text-gray-600">{m.department ?? "—"}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{m.goalSheet ? "Yes" : "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                        {m.goalSheet?.status === "submitted" && <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {m.goalSheet?.status === "submitted" && (
                        <a href={`/dashboard/manager/review/${m.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"><Eye className="h-3.5 w-3.5" /> Review</a>
                      )}
                      {m.goalSheet?.status === "approved" && (
                        <a href={`/dashboard/manager/review/${m.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"><Eye className="h-3.5 w-3.5" /> View</a>
                      )}
                      {m.goalSheet?.status === "rework" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600"><RotateCcw className="h-3.5 w-3.5" /> Sent Back</span>
                      )}
                      {(!m.goalSheet || m.goalSheet.status === "draft") && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400"><Bell className="h-3.5 w-3.5" /> Remind</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
          {team.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No team members found.</div>}
        </div>
      )}

      {tab === "checkins" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {checkins.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No check-in data yet. Check-ins appear after goal sheets are approved.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr><th className="px-4 py-3 text-left">Employee</th><th className="px-4 py-3 text-left">Goal</th><th className="px-4 py-3 text-center">Target</th><th className="px-4 py-3 text-center">Quarter</th><th className="px-4 py-3 text-center">Actual</th><th className="px-4 py-3 text-center">Score</th><th className="px-4 py-3 text-left">Comment</th><th className="px-4 py-3"></th></tr>
                </thead>
              <tbody className="divide-y divide-gray-100">
                {checkins.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{c.employee_name}</td>
                    <td className="px-4 py-3 text-gray-700">{c.goal_title}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.goal_uom === "timeline" ? c.goal_target_date : c.goal_target}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{c.quarter}</span></td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.goal_uom === "timeline" ? c.completion_date ?? "—" : c.actual_achievement ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {(() => {
                        const s = computeScore(c.goal_uom, c.goal_target, c.actual_achievement, c.goal_target_date, c.completion_date);
                        return s === null ? "—" : `${s.toFixed(1)}%`;
                      })()}
                    </td>
                    <td className="px-4 py-3"><input type="text" defaultValue={c.manager_comment ?? ""} placeholder="Add comment..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      onBlur={(e) => saveComment(c.id, e.target.value)} /></td>
                    <td className="px-4 py-3">{c._saving && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
