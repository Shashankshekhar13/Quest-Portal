import { requireRole } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("manager");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
