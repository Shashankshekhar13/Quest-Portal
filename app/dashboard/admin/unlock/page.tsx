"use client";

import { useState, useEffect } from "react";
import { Unlock, Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { User, GoalSheet } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function UnlockGoalsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  
  const [toast, setToast] = useState<{type: "success"|"error", msg: string}|null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setSearch("");
    setLoadingSheet(true);
    setSheet(null);
    
    const supabase = createClient();
    const { data } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", user.id)
      .eq("cycle_year", 2026)
      .maybeSingle();
      
    setSheet(data as GoalSheet);
    setLoadingSheet(false);
  };

  const handleUnlock = async () => {
    if (!sheet) return;
    setUnlocking(true);
    const res = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId: sheet.id })
    });
    
    if (res.ok) {
      const { sheet: updatedSheet } = await res.json();
      setSheet(updatedSheet);
      setToast({ type: "success", msg: "Goal sheet unlocked successfully! Employee can now edit." });
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ type: "error", msg: "Failed to unlock goal sheet." });
      setTimeout(() => setToast(null), 4000);
    }
    setUnlocking(false);
  };

  const filteredUsers = search ? users.filter(u => 
    (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5) : []; // show top 5

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Unlock className="h-6 w-6 text-brand-600" /> Unlock Goals
        </h1>
        <p className="text-gray-500 mt-1">Search for an employee to unlock their approved goal sheet.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative z-40">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Type name or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
          {loadingUsers && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
        </div>
        
        {search && filteredUsers.length > 0 && (
          <div className="absolute left-6 right-6 top-[85px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            {filteredUsers.map(u => (
              <button 
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">{u.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">
            Employee Details
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div><p className="text-sm text-gray-500">Name</p><p className="font-medium text-gray-900">{selectedUser.name}</p></div>
            <div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-900">{selectedUser.email}</p></div>
            <div><p className="text-sm text-gray-500">Department</p><p className="font-medium text-gray-900">{selectedUser.department || "—"}</p></div>
            <div><p className="text-sm text-gray-500">Cycle</p><p className="font-medium text-gray-900">FY 2026-27</p></div>
          </div>

          {loadingSheet ? (
             <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
          ) : !sheet ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500 border border-gray-100">
              This employee hasn't started their goal sheet yet.
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Status</p>
                  <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm font-bold ${
                    sheet.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    sheet.status === "submitted" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-200 text-gray-700"
                  }`}>
                    {sheet.status.toUpperCase()}
                  </span>
                </div>
                
                {sheet.status === "approved" || sheet.status === "submitted" ? (
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                  >
                    {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                    Unlock for Edit
                  </button>
                ) : (
                  <div className="text-sm text-gray-500 italic">Sheet is already unlocked (draft/rework)</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
