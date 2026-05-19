"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User, GoalSheet, Goal } from "@/lib/types";
import { ArrowLeft, CheckCircle, RotateCcw, Loader2, AlertCircle, X, Lock } from "lucide-react";

const UOM_LABELS: Record<string, string> = {
  min: "Higher is better", max: "Lower is better", timeline: "Date-based", zero: "Zero = Success",
};

export default function ManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.employeeId as string;
  const supabase = createClient();

  const [employee, setEmployee] = useState<User | null>(null);
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkReason, setReworkReason] = useState("");
  const [reworkSubmitting, setReworkSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ goalId: string; field: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: emp } = await supabase.from("users").select("*").eq("id", employeeId).single();
    if (emp) setEmployee(emp as User);

    const { data: sheetData } = await supabase.from("goal_sheets").select("*").eq("employee_id", employeeId).eq("cycle_year", 2026).maybeSingle();
    if (sheetData) {
      setSheet(sheetData as GoalSheet);
      const { data: goalsData } = await supabase.from("goals").select("*").eq("sheet_id", sheetData.id).order("created_at");
      setGoals((goalsData ?? []) as Goal[]);
    }
    setLoading(false);
  }, [employeeId, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateGoalField = async (goalId: string, field: string, value: string) => {
    const payload: Record<string, unknown> = {};
    if (field === "weightage" || field === "target") payload[field] = Number(value);
    else payload[field] = value;

    await fetch(`/api/goals/${goalId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, [field]: field === "weightage" || field === "target" ? Number(value) : value } : g));
    setEditingCell(null);
  };

  const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage ?? 0), 0);

  const handleApprove = async () => {
    if (totalWeightage !== 100) { showToast("error", `Total weightage is ${totalWeightage}%, must be exactly 100%.`); return; }
    setApproving(true);
    const res = await fetch(`/api/goal-sheets/${sheet!.id}/approve`, { method: "POST" });
    const data = await res.json();
    if (data.success) { showToast("success", "Goal sheet approved!"); fetchData(); }
    else showToast("error", data.error);
    setApproving(false);
  };

  const handleRework = async () => {
    if (!reworkReason.trim()) return;
    setReworkSubmitting(true);
    const res = await fetch(`/api/goal-sheets/${sheet!.id}/rework`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reworkReason }),
    });
    const data = await res.json();
    if (data.success) { showToast("success", "Rework request sent."); setShowReworkModal(false); fetchData(); }
    else showToast("error", data.error);
    setReworkSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  if (!sheet || !employee) return <div className="py-20 text-center text-gray-400">Goal sheet not found.</div>;

  const isSubmitted = sheet.status === "submitted";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/manager")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="h-5 w-5 text-gray-500" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{employee.name}&apos;s Goal Sheet</h1>
          <p className="text-sm text-gray-500">{employee.email} &middot; {employee.department}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border-2 text-center ${totalWeightage === 100 ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
          <p className="text-xs text-gray-500">Total</p>
          <p className={`text-xl font-bold ${totalWeightage === 100 ? "text-emerald-600" : "text-red-600"}`}>{totalWeightage}%</p>
        </div>
      </div>

      {sheet.status === "approved" && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Lock className="h-5 w-5 text-emerald-600" /><p className="text-sm font-medium text-emerald-800">This goal sheet has been approved and locked.</p>
        </div>
      )}

      {/* Goals Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr><th className="px-4 py-3 text-left">Thrust Area</th><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-center">UoM</th><th className="px-4 py-3 text-center">Target</th><th className="px-4 py-3 text-center">Weightage</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {goals.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{g.thrust_area || "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{g.title}</td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate">{g.description || "—"}</td>
                <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{g.uom ? UOM_LABELS[g.uom] ?? g.uom : "—"}</span></td>
                {/* Inline editable Target */}
                <td className="px-4 py-3 text-center">
                  {editingCell?.goalId === g.id && editingCell.field === "target" && isSubmitted ? (
                    <input autoFocus type="number" defaultValue={g.target ?? ""} className="w-20 px-2 py-1 border rounded text-center text-sm focus:ring-1 focus:ring-brand-500"
                      onBlur={(e) => updateGoalField(g.id, "target", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingCell(null); }} />
                  ) : (
                    <span onClick={() => isSubmitted && setEditingCell({ goalId: g.id, field: "target" })}
                      className={`${isSubmitted ? "cursor-pointer hover:bg-blue-50 hover:text-blue-700 px-2 py-1 rounded transition-colors" : ""}`}>
                      {g.uom === "timeline" ? g.target_date ?? "—" : g.target ?? "—"}
                    </span>
                  )}
                </td>
                {/* Inline editable Weightage */}
                <td className="px-4 py-3 text-center">
                  {editingCell?.goalId === g.id && editingCell.field === "weightage" && isSubmitted ? (
                    <input autoFocus type="number" min={10} max={100} defaultValue={g.weightage ?? ""} className="w-20 px-2 py-1 border rounded text-center text-sm focus:ring-1 focus:ring-brand-500"
                      onBlur={(e) => updateGoalField(g.id, "weightage", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingCell(null); }} />
                  ) : (
                    <span onClick={() => isSubmitted && setEditingCell({ goalId: g.id, field: "weightage" })}
                      className={`font-semibold ${isSubmitted ? "cursor-pointer hover:bg-blue-50 hover:text-blue-700 px-2 py-1 rounded transition-colors" : ""}`}>
                      {g.weightage !== null ? `${g.weightage}%` : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {isSubmitted && (
        <div className="flex justify-end gap-3 pb-8">
          <button onClick={() => setShowReworkModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
            <RotateCcw className="h-4 w-4" /> Request Rework
          </button>
          <button onClick={handleApprove} disabled={approving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve Goals
          </button>
        </div>
      )}

      {/* Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Request Rework</h3>
              <button onClick={() => setShowReworkModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500">Explain what changes are needed. This message will be shown to {employee.name}.</p>
            <textarea value={reworkReason} onChange={(e) => setReworkReason(e.target.value)} rows={4} placeholder="Reason for rework (required)..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none" />
            {!reworkReason.trim() && <p className="text-xs text-red-500">Reason is required.</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReworkModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleRework} disabled={!reworkReason.trim() || reworkSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {reworkSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Send Rework Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
