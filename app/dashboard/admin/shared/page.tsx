"use client";

import { useState, useEffect } from "react";
import { Share2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { User } from "@/lib/types";

export default function SharedGoalsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{type: "success"|"error", msg: string}|null>(null);

  const [formData, setFormData] = useState({
    title: "",
    thrust_area: "",
    uom: "timeline",
    target: ""
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        // Only employees can receive goals
        setUsers((data.users || []).filter((u: User) => u.role === "employee"));
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleSelectAll = (filtered: User[]) => {
    const allSelected = filtered.every(u => selectedIds.has(u.id));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      filtered.forEach(u => newSet.delete(u.id));
    } else {
      filtered.forEach(u => newSet.add(u.id));
    }
    setSelectedIds(newSet);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setToast({ type: "error", msg: "Please select at least one employee." });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setSaving(true);
    const targetVal = formData.uom === "timeline" ? null : Number(formData.target);
    const targetDate = formData.uom === "timeline" ? formData.target : null;

    const res = await fetch("/api/admin/shared-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        thrust_area: formData.thrust_area,
        uom: formData.uom,
        target: targetVal,
        target_date: targetDate,
        employee_ids: Array.from(selectedIds)
      })
    });

    if (res.ok) {
      const data = await res.json();
      setToast({ type: "success", msg: `Goal pushed successfully to ${data.results.success} employees.` });
      setFormData({ title: "", thrust_area: "", uom: "timeline", target: "" });
      setSelectedIds(new Set());
      setTimeout(() => setToast(null), 5000);
    } else {
      setToast({ type: "error", msg: "Failed to push shared goal." });
      setTimeout(() => setToast(null), 4000);
    }
    setSaving(false);
  };

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (u.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="h-6 w-6 text-brand-600" /> Push Shared Goal
        </h1>
        <p className="text-gray-500 mt-1">Create a mandatory goal and distribute it to multiple employees simultaneously.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Form */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Goal Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Complete Security Training" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thrust Area (Optional)</label>
              <input type="text" value={formData.thrust_area} onChange={e => setFormData({...formData, thrust_area: e.target.value})} placeholder="e.g. Compliance" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
              <select value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value, target: ""})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500">
                <option value="min">Numeric (Higher is better)</option>
                <option value="max">Numeric (Lower is better)</option>
                <option value="timeline">Timeline (Date-based)</option>
                <option value="zero">Zero Tolerance</option>
              </select>
            </div>
            
            {formData.uom !== "zero" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <input 
                  required 
                  type={formData.uom === "timeline" ? "date" : "number"} 
                  value={formData.target} 
                  onChange={e => setFormData({...formData, target: e.target.value})} 
                  placeholder="Enter target value..." 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-medium">Selected Employees</span>
                <span className="bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.size}</span>
              </div>
              <button 
                type="submit" 
                disabled={saving || selectedIds.size === 0} 
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />} 
                Push Goal
              </button>
            </div>
          </form>
        </div>

        {/* Employee Selection Table */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Select Recipients</h2>
            <input 
              type="text" 
              placeholder="Filter by name or dept..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500 text-xs uppercase tracking-wider sticky top-0 border-b border-gray-200 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input 
                        type="checkbox" 
                        checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id))}
                        onChange={() => handleSelectAll(filteredUsers)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleSelect(u.id)}>
                      <td className="px-6 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(u.id)}
                          onChange={() => {}} // handled by tr click
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-3 text-gray-600">{u.department || "—"}</td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No employees found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
