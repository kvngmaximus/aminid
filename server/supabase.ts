import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Fail fast in dev to surface missing environment variables
  console.warn("[supabase-admin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.");
}

export const supabaseAdmin = createClient(url as string, serviceKey as string);