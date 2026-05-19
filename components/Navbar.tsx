"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/lib/types";
import {
  Target,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck,
  Settings,
  Shield,
  ChevronDown,
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_LINKS: Record<UserRole, NavLink[]> = {
  employee: [
    {
      label: "Dashboard",
      href: "/dashboard/employee",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "My Goals",
      href: "/dashboard/employee/goals",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Check-ins",
      href: "/dashboard/employee/checkins",
      icon: <CalendarCheck className="h-4 w-4" />,
    },
  ],
  manager: [
    {
      label: "Dashboard",
      href: "/dashboard/manager",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "My Team",
      href: "/dashboard/manager/team",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Goal Sheets",
      href: "/dashboard/manager/sheets",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Check-ins",
      href: "/dashboard/manager/checkins",
      icon: <CalendarCheck className="h-4 w-4" />,
    },
  ],
  admin: [
    {
      label: "Dashboard",
      href: "/dashboard/admin",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Cycles",
      href: "/dashboard/admin/cycles",
      icon: <CalendarCheck className="h-4 w-4" />,
    },
    {
      label: "Audit Logs",
      href: "/dashboard/admin/audit",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ],
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  employee: "bg-blue-100 text-blue-700 border-blue-200",
  manager: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchUser = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (data) {
        setUser(data as User);
      }
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  const links = NAV_LINKS[user.role];
  const badgeStyle = ROLE_BADGE_STYLES[user.role];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a
              href={`/dashboard/${user.role}`}
              className="flex items-center gap-2.5 group"
            >
              <div className="p-1.5 bg-brand-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                AtomQuest
              </span>
            </a>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {link.icon}
                  {link.label}
                  {user.role === 'manager' && link.href === '/dashboard/manager' && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 shadow-sm" />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Profile Section */}
          <div className="relative">
            <button
              id="navbar-profile-button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user.name ?? user.email}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${badgeStyle}`}
                >
                  {user.role}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.department && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {user.department}
                    </p>
                  )}
                </div>

                {/* Mobile nav links */}
                <div className="md:hidden py-1 border-b border-gray-100">
                  {links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {link.icon}
                      {link.label}
                    </a>
                  ))}
                </div>

                <button
                  id="navbar-logout-button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
