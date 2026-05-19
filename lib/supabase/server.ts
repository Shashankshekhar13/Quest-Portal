import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. In Next.js 15, cookies() is async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  
  // If the URL is just the project reference ID (e.g. efunwcxvsgvxecewshso), convert it to a full URL
  if (supabaseUrl && !supabaseUrl.startsWith("http")) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  }

  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component where cookies can't be set.
            // Safe to ignore when middleware handles session refresh.
          }
        },
      },
    }
  );
}
