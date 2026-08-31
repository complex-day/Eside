import { createClient } from "@/lib/supabase/server";

export async function checkTypes() {
  const supabase = await createClient();

  const userQuery = await supabase
    .from("users")
    .select("id, username, avatar_url, bio, created_at")
    .single();

  const expQuery = await supabase
    .from("experiences")
    .select("id, title, story, status, created_at, deleted_at, category_id");

  return {
    user: userQuery.data,
    experiences: expQuery.data,
  };
}

export type InferredCheckResult = Awaited<ReturnType<typeof checkTypes>>;
export type InferredProfile = InferredCheckResult["user"];
export type InferredUserExperiences = InferredCheckResult["experiences"];
