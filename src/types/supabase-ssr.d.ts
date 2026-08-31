import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenericSchema, SupabaseClientOptions } from "@supabase/supabase-js/dist/module/lib/types";
import type {
  CookieMethodsServer,
  CookieMethodsBrowser,
  CookieOptionsWithName,
} from "@supabase/ssr/dist/module/types";

declare module "@supabase/ssr" {
  export function createServerClient<
    Database = Record<string, unknown>,
    SchemaName extends string & keyof Database = "public" extends keyof Database ? "public" : string & keyof Database,
    Schema extends GenericSchema = Database[SchemaName] extends GenericSchema ? Database[SchemaName] : GenericSchema
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options: SupabaseClientOptions<SchemaName> & {
      cookieOptions?: CookieOptionsWithName;
      cookies: CookieMethodsServer;
      cookieEncoding?: "raw" | "base64url";
    }
  ): SupabaseClient<Database, SchemaName, SchemaName, Schema>;

  export function createBrowserClient<
    Database = Record<string, unknown>,
    SchemaName extends string & keyof Database = "public" extends keyof Database ? "public" : string & keyof Database,
    Schema extends GenericSchema = Database[SchemaName] extends GenericSchema ? Database[SchemaName] : GenericSchema
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<SchemaName> & {
      cookies?: CookieMethodsBrowser;
      cookieOptions?: CookieOptionsWithName;
      cookieEncoding?: "raw" | "base64url";
      isSingleton?: boolean;
    }
  ): SupabaseClient<Database, SchemaName, SchemaName, Schema>;
}
