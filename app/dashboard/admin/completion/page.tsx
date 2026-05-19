"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, Check, Minus, BarChart3, Users, CheckCircle, FileText } from "lucide-react";

interface EmployeeRow {
  name: string;
  department: string | null;
  manager: string | null;
  sheetStatus: string;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function CompletionDashboard() {
  const [data, setData] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("All");

  const fetchData = async () => {
    // In a real app this would fetch from a dedicated API
    // For now we'll fetch users + checkins directly via Supabase client to satisfy real-time reqs
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data: users } = await supabase.from("users").select("id, name, department").eq("role", "employee");
      if (!users) { setLoading(false); return; }

      const rows: EmployeeRow[] = [];
      for (const emp of users) {
        const { data: mgr } = await supabase.from("users").select("manager_id").eq("id", emp.id).single();
        let managerName = "—";
        if (mgr?.manager_id) {
          const { data: mData } = await supabase.from("users").select("name").eq("id", mgr.manager_id).single();
          if (mData) managerName = mData.name || "—";
        }

        const { data: sheet } = await supabase.from("goal_sheets").select("id, status").eq("employee_id", emp.id).eq("cycle_year", 2026).maybeSingle();
        let q1 = false, q2 = false, q3 = false, q4 = false;
        let status = "Not Started";

        if (sheet) {
          status = sheet.status;
          if (status === "approved") {
            const { data: goals } = await supabase.from("goals").select("id").eq("sheet_id", sheet.id);
            const goalIds = (goals || []).map((g: any) => g.id);
            if (goalIds.length > 0) {
              const { data: checkins } = await supabase.from("checkins").select("quarter").in("goal_id", goalIds);
              const qs = new Set((checkins || []).map((c: any) => c.quarter));
              q1 = qs.has("Q1"); q2 = qs.has("Q2"); q3 = qs.has("Q3"); q4 = qs.has("Q4");
            }
          }
        }
        rows.push({ name: emp.name || "", department: emp.department, manager: managerName, sheetStatus: status, q1, q2, q3, q4 });
      }
      setData(rows);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCompletion = () => {
    window.open("/api/reports/completion", "_blank");
  };

  const handleExportAchievement = () => {
    window.open("/api/reports/achievement", "_blank");
  };

  const depts = ["All", ...Array.from(new Set(data.map(d => d.department).filter(Boolean)))];
  const filteredData = filterDept === "All" ? data : data.filter(d => d.department === filterDept);

  const stats = {
    total: data.length,
    draft: data.filter(d => ["draft", "Not Started"].includes(d.sheetStatus)).length,
    submitted: data.filter(d => ["submitted"].includes(d.sheetStatus)).length,
    rework: data.filter(d => d.sheetStatus === "rework").length,
    approved: data.filter(d => d.sheetStatus === "approved").length,
    checkins: data.filter(d => d.q1 || d.q2 || d.q3 || d.q4).length
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-600" /> Completion Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Live overview of organization-wide goal and check-in completion.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCompletion} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm text-sm">
            <Download className="h-4 w-4" /> Completion CSV
          </button>
          <button onClick={handleExportAchievement} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition shadow-sm text-sm">
            <Download className="h-4 w-4" /> Achievement CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Employees", value: stats.total, icon: <Users className="h-5 w-5" />, color: "text-blue-600 bg-blue-100" },
          { label: "Goals Submitted", value: stats.submitted, icon: <FileText className="h-5 w-5" />, color: "text-amber-600 bg-amber-100" },
          { label: "Goals Approved", value: stats.approved, icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-100" },
          { label: "Check-ins Complete", value: stats.checkins, icon: <BarChart3 className="h-5 w-5" />, color: "text-purple-600 bg-purple-100" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 mt-1"><AnimatedNumber value={s.value} /></p></div>
              <div className={`p-2.5 rounded-lg ${s.color}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart: Goal Status Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Goal Sheet Status Distribution</h2>
        <div className="flex w-full h-10 rounded-full overflow-hidden mb-4">
          <div style={{ width: `${stats.total ? (stats.draft/stats.total)*100 : 0}%` }} className="bg-gray-300 transition-all duration-1000 ease-out" title={`Draft: ${stats.draft}`} />
          <div style={{ width: `${stats.total ? (stats.submitted/stats.total)*100 : 0}%` }} className="bg-amber-400 transition-all duration-1000 ease-out" title={`Submitted: ${stats.submitted}`} />
          <div style={{ width: `${stats.total ? (stats.rework/stats.total)*100 : 0}%` }} className="bg-red-400 transition-all duration-1000 ease-out" title={`Rework: ${stats.rework}`} />
          <div style={{ width: `${stats.total ? (stats.approved/stats.total)*100 : 0}%` }} className="bg-emerald-500 transition-all duration-1000 ease-out" title={`Approved: ${stats.approved}`} />
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /><span className="text-gray-600">Not Started/Draft ({stats.draft})</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-gray-600">Awaiting Review ({stats.submitted})</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-gray-600">Rework Requested ({stats.rework})</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-gray-600">Approved ({stats.approved})</span></div>
        </div>
      </div>

      {/* Employee Tracking Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Employee Tracking</h2>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {depts.map(d => <option key={d as string} value={d as string}>{d}</option>)}
          </select>
        </div>
        
        <div className="flex-1 overflow-x-auto relative">
          {loading && data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : null}
          
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 border-b border-gray-200 shadow-sm z-0">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-4 py-4 font-medium">Department</th>
                <th className="px-4 py-4 font-medium">Manager</th>
                <th className="px-4 py-4 font-medium">Sheet Status</th>
                <th className="px-4 py-4 font-medium text-center">Q1</th>
                <th className="px-4 py-4 font-medium text-center">Q2</th>
                <th className="px-4 py-4 font-medium text-center">Q3</th>
                <th className="px-4 py-4 font-medium text-center">Q4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((emp, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.manager}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                      emp.sheetStatus === "approved" ? "bg-emerald-100 text-emerald-700" :
                      emp.sheetStatus === "submitted" ? "bg-amber-100 text-amber-700" :
                      emp.sheetStatus === "rework" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {emp.sheetStatus.replace("_", " ")}
                    </span>
                  </td>
                  {[emp.q1, emp.q2, emp.q3, emp.q4].map((q, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      {q ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <Minus className="h-4 w-4 text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredData.length === 0 && !loading && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No employees found in this department.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
