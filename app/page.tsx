import { Target, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <Target className="h-12 w-12 text-brand-600" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            AtomQuest
          </h1>
        </div>

        <p className="text-lg text-gray-600 text-balance">
          Atomberg&apos;s goal-setting and performance tracking portal. Set
          ambitious goals, track quarterly progress, and drive organizational
          alignment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Goal Setting</h3>
            <p className="text-sm text-gray-500">
              Define goals with thrust areas, UOMs, targets, and weightages.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Quarterly Check-ins</h3>
            <p className="text-sm text-gray-500">
              Track progress every quarter with manager reviews and comments.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Manager View</h3>
            <p className="text-sm text-gray-500">
              Approve goals, share goals across teams, and monitor performance.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
