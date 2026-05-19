import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components (browser).
 */
export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  
  // If the URL is just the project reference ID (e.g. efunwcxvsgvxecewshso), convert it to a full URL
  if (supabaseUrl && !supabaseUrl.startsWith("http")) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  }

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
