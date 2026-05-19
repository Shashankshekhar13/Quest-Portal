"use client";

import { useState, useEffect } from "react";
import { Plus, CalendarCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Cycle } from "@/lib/types";

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ name: "", phase: "goal_setting", opens_at: "", closes_at: "" });

  const fetchCycles = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cycles");
    if (res.ok) {
      const data = await res.json();
      setCycles(data.cycles || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    // Optimistic UI update
    setCycles(prev => prev.map(c => 
      c.id === id ? { ...c, is_active: !current } : { ...c, is_active: !current ? false : c.is_active }
    ));
    
    await fetch("/api/admin/cycles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current })
    });
    
    fetchCycles(); // Refresh to be safe
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setModalOpen(false);
      setFormData({ name: "", phase: "goal_setting", opens_at: "", closes_at: "" });
      fetchCycles();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-brand-600" /> Cycle Management
          </h1>
          <p className="text-gray-500 mt-1">Manage performance cycles and active check-in windows.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition"
        >
          <Plus className="h-4 w-4" /> Add Cycle
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Phase</th>
                <th className="px-6 py-4 font-medium">Window</th>
                <th className="px-6 py-4 font-medium">Status (Active)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cycles.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold uppercase">{c.phase}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {c.opens_at ? `${c.opens_at} to ${c.closes_at}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={c.is_active} onChange={() => toggleActive(c.id, c.is_active)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">{c.is_active ? "Active" : "Inactive"}</span>
                    </label>
                  </td>
                </tr>
              ))}
              {cycles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No cycles found. Add one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add New Cycle</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. FY 2026-27 Q1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select required value={formData.phase} onChange={e => setFormData({...formData, phase: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500">
                  <option value="goal_setting">Goal Setting</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opens At</label>
                  <input required type="date" value={formData.opens_at} onChange={e => setFormData({...formData, opens_at: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closes At</label>
                  <input required type="date" value={formData.closes_at} onChange={e => setFormData({...formData, closes_at: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition inline-flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
