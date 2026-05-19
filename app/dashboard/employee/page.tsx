import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FileText, CalendarCheck, Target, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { computeScore, computeWeightedScore } from "@/lib/scoring";
import { EmptyState } from "@/components/UI";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Fetch active cycle
  const { data: activeCycles } = await supabase.from("cycles").select("*").eq("is_active", true);
  const activeCycle = activeCycles && activeCycles.length > 0 ? activeCycles[0] : null;

  // Calculate countdown
  let daysLeft = null;
  if (activeCycle?.closes_at) {
    const end = new Date(activeCycle.closes_at);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Fetch goal sheet and goals
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("*")
    .eq("employee_id", user?.id)
    .eq("cycle_year", 2026)
    .maybeSingle();

  let goals: any[] = [];
  let overallProgress = 0;
  
  if (sheet) {
    const { data: g } = await supabase.from("goals").select("*").eq("sheet_id", sheet.id);
    if (g && g.length > 0) {
      goals = g;
      const goalIds = goals.map(x => x.id);
      const { data: checkins } = await supabase.from("checkins").select("*").in("goal_id", goalIds);
      
      const scoredGoals = goals.map(goal => {
        // get latest checkin for score
        const gCheckins = (checkins || []).filter(c => c.goal_id === goal.id);
        const latestCheckin = gCheckins.length > 0 ? gCheckins[gCheckins.length - 1] : null;
        
        const actualNum = latestCheckin?.actual_achievement ? Number(latestCheckin.actual_achievement) : null;
        const score = computeScore(goal.uom, goal.target, actualNum, goal.target_date, latestCheckin?.completion_date) || 0;
        
        return {
          ...goal,
          latestScore: score,
          latestCheckin,
          weightage: goal.weightage,
          score
        };
      });
      goals = scoredGoals;
      overallProgress = computeWeightedScore(scoredGoals);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header section with Welcome & Countdown */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's your goal progress overview for {activeCycle?.name || "the current cycle"}.
          </p>
        </div>
        
        {activeCycle && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Clock className={`h-5 w-5 ${daysLeft !== null && daysLeft <= 3 ? "text-red-500" : "text-brand-500"}`} />
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Phase: {activeCycle.phase}</p>
              <p className={`text-sm font-bold ${daysLeft !== null && daysLeft <= 3 ? "text-red-600" : "text-gray-900"}`}>
                {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days remaining` : "Closes today") : "No deadline"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Total Goals",
            value: String(goals.length),
            icon: <Target className="h-5 w-5" />,
            color: "text-blue-600 bg-blue-100",
          },
          {
            label: "Overall Progress",
            value: `${overallProgress.toFixed(1)}%`,
            icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>,
            color: "text-emerald-600 bg-emerald-100",
          },
          {
            label: "Goal Sheet Status",
            value: sheet ? sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1).replace("_", " ") : "Not Started",
            icon: <FileText className="h-5 w-5" />,
            color: sheet?.status === 'approved' ? "text-emerald-600 bg-emerald-100" : sheet?.status === 'rework' ? "text-red-600 bg-red-100" : "text-amber-600 bg-amber-100",
          },
          {
            label: "Next Check-in",
            value: activeCycle?.phase.startsWith("Q") ? activeCycle.phase : "N/A",
            icon: <CalendarCheck className="h-5 w-5" />,
            color: "text-purple-600 bg-purple-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Goals List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Current Goals</h2>
            {sheet?.status === "approved" ? (
              <Link href="/dashboard/employee/checkins" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Update Progress <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/dashboard/employee/goals" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Edit Goal Sheet <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          <div className="p-5 flex-1">
            {goals.length === 0 ? (
              <EmptyState 
                title="No goals set yet" 
                description="You haven't added any goals to your sheet for this cycle."
                action={
                  <Link href="/dashboard/employee/goals" className="inline-flex px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition">
                    Create Goal Sheet
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {goals.map(g => (
                  <div key={g.id} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 transition bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${g.is_shared ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {g.is_shared ? 'Mandatory' : 'Individual'}
                        </span>
                        <h3 className="font-semibold text-gray-900">{g.title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{g.description || "No description provided."}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500 font-medium uppercase">Weight</p>
                        <p className="font-bold text-gray-900">{g.weightage ? `${g.weightage}%` : '—'}</p>
                      </div>
                      <div className="w-16 h-16 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={g.latestScore >= 70 ? "#10B981" : g.latestScore >= 40 ? "#F59E0B" : "#EF4444"} strokeWidth="3" strokeDasharray={`${g.latestScore}, 100`} />
                        </svg>
                        <span className="absolute text-xs font-bold text-gray-700">{g.latestScore.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Overall Progress Ring */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-6 w-full text-left border-b border-gray-100 pb-4">Cycle Progress</h2>
          
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F3F4F6" strokeWidth="4" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${overallProgress}, 100`} className={overallProgress >= 70 ? "text-emerald-500" : overallProgress >= 40 ? "text-amber-500" : "text-brand-600"} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-900">{overallProgress.toFixed(0)}%</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Completed</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            {overallProgress >= 100 ? "Amazing job! You've completed all targets for this cycle." :
             overallProgress >= 50 ? "You're making great progress. Keep it up!" :
             "Stay focused. Update your check-ins regularly to track progress."}
          </p>
        </div>
      </div>
    </div>
  );
}
