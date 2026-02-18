import { createBrowserClient } from "@supabase/ssr";

declare global {
  interface Window {
    __SUPABASE_ENV__?: {
      url?: string;
      anonKey?: string;
    };
  }
}

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? window.__SUPABASE_ENV__?.url;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? window.__SUPABASE_ENV__?.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
