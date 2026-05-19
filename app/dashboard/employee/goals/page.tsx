"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GoalSheet, Goal, UOM } from "@/lib/types";
import {
  Plus, Trash2, Send, Save, AlertCircle, CheckCircle2,
  Loader2, FileText, Lock, RotateCcw, Target,
} from "lucide-react";

const UOM_OPTIONS: { value: UOM; label: string }[] = [
  { value: "min", label: "Numeric/% — Higher is better (e.g. Revenue)" },
  { value: "max", label: "Numeric/% — Lower is better (e.g. TAT, Cost)" },
  { value: "timeline", label: "Date-based completion" },
  { value: "zero", label: "Zero = Success (e.g. Safety incidents)" },
];

interface GoalRow {
  id?: string;
  thrust_area: string;
  title: string;
  description: string;
  uom: UOM | "";
  target: string;
  target_date: string;
  weightage: string;
  is_shared: boolean;
  shared_from_goal_id: string | null;
  _isNew?: boolean;
  _errors?: Record<string, string>;
}

function emptyGoal(): GoalRow {
  return {
    thrust_area: "", title: "", description: "", uom: "",
    target: "", target_date: "", weightage: "",
    is_shared: false, shared_from_goal_id: null, _isNew: true,
  };
}

export default function EmployeeGoalsPage() {
  const supabase = createClient();
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [sharedGoals, setSharedGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goal-sheets");
    const data = await res.json();
    if (data.sheet) {
      setSheet(data.sheet);
      const goalsRes = await fetch(`/api/goals?sheet_id=${data.sheet.id}`);
      const goalsData = await goalsRes.json();
      const personal: GoalRow[] = [];
      const shared: Goal[] = [];
      (goalsData.goals ?? []).forEach((g: Goal) => {
        if (g.is_shared) {
          shared.push(g);
        } else {
          personal.push({
            id: g.id, thrust_area: g.thrust_area ?? "", title: g.title,
            description: g.description ?? "", uom: (g.uom ?? "") as UOM | "",
            target: g.target !== null ? String(g.target) : "",
            target_date: g.target_date ?? "", weightage: g.weightage !== null ? String(g.weightage) : "",
            is_shared: false, shared_from_goal_id: null,
          });
        }
      });
      setGoals(personal);
      setSharedGoals(shared);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createSheet = async () => {
    setSaving(true);
    const res = await fetch("/api/goal-sheets", { method: "POST" });
    const data = await res.json();
    if (data.sheet) { setSheet(data.sheet); setGoals([]); }
    else showToast("error", data.error || "Failed to create sheet");
    setSaving(false);
  };

  const addGoal = () => {
    if (goals.length >= 8) return;
    setGoals([...goals, emptyGoal()]);
  };

  const updateGoalField = (index: number, field: keyof GoalRow, value: string) => {
    const updated = [...goals];
    const updatedRow = { ...updated[index], [field]: value };
    if (field === "uom" && value !== "timeline") updatedRow.target_date = "";
    if (field === "uom" && value === "timeline") updatedRow.target = "";
    updated[index] = updatedRow;
    setGoals(updated);
  };

  const removeGoal = async (index: number) => {
    const goal = goals[index];
    if (goal.id) {
      await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    }
    setGoals(goals.filter((_, i) => i !== index));
  };

  const saveGoal = async (index: number) => {
    const g = goals[index];
    if (!sheet) return;
    const payload = {
      sheet_id: sheet.id, thrust_area: g.thrust_area, title: g.title || "Untitled Goal",
      description: g.description, uom: g.uom || null,
      target: g.uom === "timeline" ? null : (g.target ? Number(g.target) : null),
      target_date: g.uom === "timeline" ? g.target_date || null : null,
      weightage: g.weightage ? Number(g.weightage) : null,
    };
    if (g.id) {
      const res = await fetch(`/api/goals/${g.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.goal) { const updated = [...goals]; updated[index].id = data.goal.id; setGoals(updated); }
    } else {
      const res = await fetch("/api/goals", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.goal) { const updated = [...goals]; updated[index] = { ...updated[index], id: data.goal.id, _isNew: false }; setGoals(updated); }
      else if (data.error) showToast("error", data.error);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    for (let i = 0; i < goals.length; i++) { await saveGoal(i); }
    showToast("success", "Draft saved successfully");
    setSaving(false);
  };

  const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage ? Number(g.weightage) : 0), 0)
    + sharedGoals.reduce((sum, g) => sum + (g.weightage ?? 0), 0);

  const validateAndSubmit = async () => {
    setSubmitErrors([]);
    const errors: string[] = [];
    const allGoals = goals;
    if (allGoals.length === 0) errors.push("Add at least one goal before submitting.");
    allGoals.forEach((g, i) => {
      if (!g.title.trim()) errors.push(`Goal ${i + 1}: Title is required.`);
      if (!g.uom) errors.push(`Goal ${i + 1}: Unit of Measurement is required.`);
      if (g.uom === "timeline" && !g.target_date) errors.push(`Goal ${i + 1}: Target date is required.`);
      if (g.uom && g.uom !== "timeline" && !g.target) errors.push(`Goal ${i + 1}: Target value is required.`);
      if (!g.weightage) errors.push(`Goal ${i + 1}: Weightage is required.`);
      else if (Number(g.weightage) < 10) errors.push(`Goal ${i + 1}: Weightage must be at least 10%.`);
    });
    if (totalWeightage !== 100) errors.push(`Total weightage must be exactly 100% (currently ${totalWeightage}%).`);
    if (errors.length > 0) { setSubmitErrors(errors); return; }

    setSubmitting(true);
    await saveDraft();
    const res = await fetch(`/api/goal-sheets/${sheet!.id}/submit`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Goal sheet submitted for approval!");
      fetchData();
    } else {
      setSubmitErrors(data.errors || [data.error]);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  // No sheet yet
  if (!sheet) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="p-4 bg-brand-100 rounded-2xl inline-block"><Target className="h-12 w-12 text-brand-600" /></div>
        <h1 className="text-2xl font-bold text-gray-900">Start Your Goal Sheet</h1>
        <p className="text-gray-500">Create your FY 2026-27 goal sheet to begin setting your objectives.</p>
        <button onClick={createSheet} disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Start Goal Sheet
        </button>
      </div>
    );
  }

  const isEditable = sheet.status === "draft" || sheet.status === "rework";
  const isSubmitted = sheet.status === "submitted";
  const isApproved = sheet.status === "approved";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Status Banner */}
      {isSubmitted && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="h-3 w-3 bg-amber-400 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-amber-800">Your goal sheet has been submitted and is awaiting manager approval.</p>
        </div>
      )}
      {isApproved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Lock className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">Your goal sheet has been approved and is now locked.</p>
        </div>
      )}
      {sheet.status === "rework" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
          <div className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-red-600" /><p className="text-sm font-bold text-red-800">Rework Requested</p></div>
          {sheet.rework_reason && <p className="text-sm text-red-700 ml-7">&ldquo;{sheet.rework_reason}&rdquo;</p>}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Goal Sheet — FY 2026-27</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className={`font-semibold ${sheet.status === "approved" ? "text-emerald-600" : sheet.status === "rework" ? "text-red-600" : sheet.status === "submitted" ? "text-amber-600" : "text-gray-600"}`}>{sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}</span>
          </p>
        </div>
        {/* Weightage Counter */}
        <div className={`text-center px-5 py-3 rounded-xl border-2 ${totalWeightage === 100 ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
          <p className="text-xs font-medium text-gray-500">Total Weightage</p>
          <p className={`text-2xl font-bold ${totalWeightage === 100 ? "text-emerald-600" : "text-red-600"}`}>{totalWeightage}<span className="text-sm font-normal">/ 100%</span></p>
        </div>
      </div>

      {/* Validation Errors */}
      {submitErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
          <p className="text-sm font-bold text-red-800 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
            {submitErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Goals Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><FileText className="h-5 w-5 text-brand-600" /> Personal Goals</h2>
          {isEditable && (
            <button onClick={addGoal} disabled={goals.length >= 8}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Plus className="h-4 w-4" /> Add Goal {goals.length >= 8 && "(Max 8)"}
            </button>
          )}
        </div>

        {goals.length === 0 && !isEditable ? (
          <div className="p-8 text-center text-gray-400 text-sm">No goals added yet.</div>
        ) : goals.length === 0 && isEditable ? (
          <div className="p-8 text-center"><p className="text-gray-400 text-sm mb-3">No goals yet. Click &ldquo;Add Goal&rdquo; to get started.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {goals.map((g, idx) => (
              <div key={g.id ?? `new-${idx}`} className="p-5 space-y-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded mt-1">#{idx + 1}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Thrust Area */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Thrust Area</label>
                      <input value={g.thrust_area} disabled={!isEditable} placeholder="e.g. Sales, Operations"
                        onChange={(e) => updateGoalField(idx, "thrust_area", e.target.value)}
                        onBlur={() => g.id && saveGoal(idx)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                    </div>
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Goal Title <span className="text-red-500">*</span></label>
                      <input value={g.title} disabled={!isEditable} placeholder="Goal title"
                        onChange={(e) => updateGoalField(idx, "title", e.target.value)}
                        onBlur={() => g.id && saveGoal(idx)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                    </div>
                    {/* UoM */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unit of Measurement <span className="text-red-500">*</span></label>
                      <select value={g.uom} disabled={!isEditable}
                        onChange={(e) => updateGoalField(idx, "uom", e.target.value)}
                        onBlur={() => g.id && saveGoal(idx)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                        <option value="">Select UoM</option>
                        {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {isEditable && (
                    <button onClick={() => removeGoal(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 ml-10">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <textarea value={g.description} disabled={!isEditable} placeholder="Optional description" rows={2}
                      onChange={(e) => updateGoalField(idx, "description", e.target.value)}
                      onBlur={() => g.id && saveGoal(idx)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                  </div>
                  {/* Target */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {g.uom === "timeline" ? "Target Date" : "Target"} <span className="text-red-500">*</span>
                    </label>
                    {g.uom === "timeline" ? (
                      <input type="date" value={g.target_date} disabled={!isEditable}
                        onChange={(e) => updateGoalField(idx, "target_date", e.target.value)}
                        onBlur={() => g.id && saveGoal(idx)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                    ) : (
                      <input type="number" value={g.target} disabled={!isEditable} placeholder="e.g. 100"
                        onChange={(e) => updateGoalField(idx, "target", e.target.value)}
                        onBlur={() => g.id && saveGoal(idx)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                    )}
                  </div>
                  {/* Weightage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Weightage % <span className="text-red-500">*</span></label>
                    <input type="number" min={10} max={100} value={g.weightage} disabled={!isEditable} placeholder="Min 10"
                      onChange={(e) => updateGoalField(idx, "weightage", e.target.value)}
                      onBlur={() => g.id && saveGoal(idx)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Goals Section */}
      {sharedGoals.length > 0 && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/50">
            <h2 className="text-lg font-semibold text-indigo-900">Shared Goals from Manager</h2>
            <p className="text-xs text-indigo-600 mt-0.5">You can only edit the weightage for shared goals.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {sharedGoals.map((sg) => (
              <div key={sg.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{sg.title}</p>
                  <p className="text-xs text-gray-500">{sg.thrust_area} &middot; {UOM_OPTIONS.find(o => o.value === sg.uom)?.label ?? sg.uom} &middot; Target: {sg.uom === "timeline" ? sg.target_date : sg.target}</p>
                </div>
                <div className="w-24">
                  <input type="number" min={10} max={100} defaultValue={sg.weightage ?? ""} disabled={!isEditable}
                    onBlur={async (e) => {
                      await fetch(`/api/goals/${sg.id}`, {
                        method: "PUT", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ weightage: Number(e.target.value) }),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isEditable && (
        <div className="flex items-center justify-between pt-2 pb-8">
          <p className="text-xs text-gray-400">Goals auto-save when you click away from a field.</p>
          <div className="flex gap-3">
            <button onClick={saveDraft} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
            </button>
            <button onClick={validateAndSubmit} disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for Approval
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
