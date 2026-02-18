import { createBrowserClient } from "@supabase/ssr";

declare global {
  interface Window {
    __SUPABASE_ENV__?: {
      url?: string;
      anonKey?: string;
    };
  }
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? (typeof window !== "undefined" ? window.__SUPABASE_ENV__?.url : undefined);
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? (typeof window !== "undefined" ? window.__SUPABASE_ENV__?.anonKey : undefined);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
