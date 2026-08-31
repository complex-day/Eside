import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

const client = createServerClient<Database>("url", "key", {} as never);

export type ClientType = typeof client;

// Test querying "users" table
export type UsersQuery = ReturnType<typeof client.from<"users">>;

// Test querying select on users
export type SelectUsersQuery = ReturnType<typeof client.from<"users">> extends {
  select: (query?: infer Q) => infer R;
}
  ? R
  : never;
