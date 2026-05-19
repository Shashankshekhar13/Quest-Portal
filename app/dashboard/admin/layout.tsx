"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { LayoutDashboard, CalendarCheck, BarChart3, Shield, Unlock, Share2 } from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Cycle Management", href: "/dashboard/admin/cycles", icon: CalendarCheck },
  { name: "Completion Dashboard", href: "/dashboard/admin/completion", icon: BarChart3 },
  { name: "Audit Log", href: "/dashboard/admin/audit", icon: Shield },
  { name: "Shared Goals", href: "/dashboard/admin/shared", icon: Share2 },
  { name: "Unlock Goals", href: "/dashboard/admin/unlock", icon: Unlock },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex w-full max-w-7xl mx-auto overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:block">
          <nav className="h-full px-3 py-6 space-y-1">
            <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Admin Menu
            </h2>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-brand-600" : "text-gray-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
