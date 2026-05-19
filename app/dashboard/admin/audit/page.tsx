"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Loader2, Calendar } from "lucide-react";
import type { AuditLog, User } from "@/lib/types";

interface LogWithUser extends AuditLog {
  users?: { name: string; email: string } | null;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("audit_logs")
        .select(`*, users(name, email)`)
        .order("created_at", { ascending: false })
        .limit(200); // Fetch top 200 for client-side filtering
      
      setLogs((data || []) as LogWithUser[]);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (!dateRange.start && !dateRange.end) return true;
      const logDate = new Date(log.created_at);
      if (dateRange.start) {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
      return true;
    });
  }, [logs, dateRange]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-600" /> Audit Logs
          </h1>
          <p className="text-gray-500 mt-1">System-wide trail of important actions and state changes.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400 ml-2" />
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
            className="text-sm border-none focus:ring-0 text-gray-600"
          />
          <span className="text-gray-400">to</span>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
            className="text-sm border-none focus:ring-0 text-gray-600"
          />
          {(dateRange.start || dateRange.end) && (
            <button onClick={() => setDateRange({start:"", end:""})} className="text-xs text-brand-600 font-medium px-2 hover:underline">Clear</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Table</th>
                  <th className="px-6 py-4 font-medium">Changes (Diff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map(log => {
                  const d = new Date(log.created_at);
                  const timestamp = d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">{timestamp}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{log.users?.name || "System"}</div>
                        <div className="text-xs text-gray-500">{log.users?.email || ""}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-semibold whitespace-nowrap">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{log.table_name || "—"}</td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-xs font-mono space-y-1 overflow-hidden">
                          {log.old_value && (
                            <div className="bg-red-50 text-red-700 p-2 rounded border border-red-100 overflow-x-auto">
                              <span className="font-bold mr-1">-</span> {JSON.stringify(log.old_value)}
                            </div>
                          )}
                          {log.new_value && (
                            <div className="bg-emerald-50 text-emerald-700 p-2 rounded border border-emerald-100 overflow-x-auto">
                              <span className="font-bold mr-1">+</span> {JSON.stringify(log.new_value)}
                            </div>
                          )}
                          {!log.old_value && !log.new_value && <span className="text-gray-400">No changes recorded</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No audit logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
