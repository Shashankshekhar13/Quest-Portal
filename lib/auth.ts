import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/lib/types";

/**
 * Get the current authenticated user with their role from the public.users table.
 * Returns null if not authenticated or user not found in public.users.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error || !userData) {
    return null;
  }

  return userData as User;
}

/**
 * Require a specific role. If the current user doesn't have the required role,
 * redirect them to their correct dashboard.
 */
export async function requireRole(role: UserRole): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    redirect(`/dashboard/${user.role}`);
  }

  return user;
}

/**
 * Get all employees who report to a given manager.
 */
export async function getManagerTeam(managerId: string): Promise<User[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("manager_id", managerId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching manager team:", error.message);
    return [];
  }

  return (data ?? []) as User[];
}
