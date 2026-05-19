import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware that protects all routes except public ones.
 * - Refreshes the Supabase auth session on every request.
 * - Redirects unauthenticated users to /login.
 * - Redirects authenticated users on /login to their role-based dashboard.
 */

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === "your_url" ||
    supabaseAnonKey === "your_key"
  ) {
    // Supabase not configured — allow all routes (dev mode)
    return NextResponse.next();
  }

  // If the URL is just the project reference ID (e.g. efunwcxvsgvxecewshso), convert it to a full URL
  if (supabaseUrl && !supabaseUrl.startsWith("http")) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Public routes — allow through
    if (isPublicRoute(pathname)) {
      // If authenticated user visits /login, redirect to their dashboard
      if (pathname === "/login" && user) {
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (userData?.role) {
            return NextResponse.redirect(
              new URL(`/dashboard/${userData.role}`, request.url)
            );
          }
        } catch (dbError) {
          console.error("Middleware DB Error on login check:", dbError);
        }
      }
      return supabaseResponse;
    }

    // Protected routes — redirect to login if no session
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection for dashboard paths
    if (pathname.startsWith("/dashboard/")) {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData?.role) {
          const expectedPath = `/dashboard/${userData.role}`;
          if (!pathname.startsWith(expectedPath)) {
            return NextResponse.redirect(new URL(expectedPath, request.url));
          }
        }
      } catch (dbError) {
        console.error("Middleware DB Error on role check:", dbError);
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware unhandled exception caught:", error);
    
    // In case of any unhandled middleware exception (e.g. database / network down),
    // allow public routes to resolve normally so users aren't locked out of the login page,
    // otherwise redirect to /login to ensure security.
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }
    
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "middleware_error");
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  runtime: "nodejs", // Execute in stable Node.js runtime to prevent edge-specific runtime errors
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
