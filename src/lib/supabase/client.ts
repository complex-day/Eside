import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Creates a browser-side Supabase client.
 * Safe for Client Components and client-side hooks.
 */
export function createClient() {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

