"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Target, LogIn, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface DemoCredential {
  label: string;
  email: string;
  password: string;
  role: UserRole;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    label: "Employee",
    email: "emp1@atomberg.com",
    password: "password123",
    role: "employee",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    label: "Manager",
    email: "manager@atomberg.com",
    password: "password123",
    role: "manager",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    label: "Admin",
    email: "admin@atomberg.com",
    password: "password123",
    role: "admin",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginForm) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const supabase = createClient();

      // Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) {
        setServerError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setServerError("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Fetch role from public.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        setServerError(
          "Account not found in the system. Contact your administrator."
        );
        setIsLoading(false);
        return;
      }

      // Redirect to role-based dashboard
      const role = userData.role as UserRole;
      router.push(`/dashboard/${role}`);
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (cred: DemoCredential) => {
    setValue("email", cred.email);
    setValue("password", cred.password);
    setServerError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-2.5 bg-brand-600 rounded-xl shadow-lg shadow-brand-600/25">
              <Target className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              AtomQuest
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            Sign in to your goal portal account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Server Error */}
            {serverError && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@atomberg.com"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            🚀 Demo Credentials
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Click any card below to auto-fill login credentials
          </p>

          <div className="space-y-3">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                id={`demo-login-${cred.role}`}
                type="button"
                onClick={() => fillDemoCredentials(cred)}
                className={`w-full text-left p-3.5 rounded-xl border-2 ${cred.borderColor} ${cred.bgColor} hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-wider ${cred.color} mb-1`}
                    >
                      {cred.label}
                    </span>
                    <p className="text-sm text-gray-700 font-medium">
                      {cred.email}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      password123
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${cred.color} ${cred.bgColor} border ${cred.borderColor} group-hover:scale-105 transition-transform`}
                  >
                    {cred.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
