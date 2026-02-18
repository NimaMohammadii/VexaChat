import { createClient } from "@supabase/supabase-js";

// On Render, ensure these env vars are set: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
