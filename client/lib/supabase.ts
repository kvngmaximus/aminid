import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export type Profile = {
  id: string;
  name: string | null;
  user_type: "reader" | "author" | "admin";
  status: "active" | "suspended" | "disabled";
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,name,user_type,status")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}