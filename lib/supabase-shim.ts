type CookieHandlers = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void;
};

type OAuthOptions = {
  provider: "google";
  options?: { redirectTo?: string };
};

function resolveConfig(explicitUrl?: string, explicitAnonKey?: string) {
  const url = explicitUrl ?? process.env.SUPABASE_URL;
  const anonKey = explicitAnonKey ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
  }

  return { url, anonKey };
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomVerifier() {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(64)));
}

function shouldUseSecureCookie() {
  if (typeof window !== "undefined") {
    return window.location.protocol === "https:";
  }

  return process.env.NODE_ENV === "production";
}

async function codeChallenge(verifier: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return encodeBase64Url(new Uint8Array(hash));
}

export function createBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
  return {
    auth: {
      async signInWithOAuth({ provider, options }: OAuthOptions) {
        if (provider !== "google") {
          return { data: null, error: new Error("Only Google OAuth is supported.") };
        }

        const { url, anonKey } = resolveConfig(supabaseUrl, supabaseAnonKey);
        const verifier = randomVerifier();
        const challenge = await codeChallenge(verifier);
        const redirectTo = options?.redirectTo ?? `${window.location.origin}/auth/callback`;

        const secureFlag = shouldUseSecureCookie() ? "; Secure" : "";
        document.cookie = `sb-code-verifier=${encodeURIComponent(verifier)}; Path=/; SameSite=Lax${secureFlag}; Max-Age=600`;

        const authorizeUrl = new URL("/auth/v1/authorize", url);
        authorizeUrl.searchParams.set("provider", "google");
        authorizeUrl.searchParams.set("redirect_to", redirectTo);
        authorizeUrl.searchParams.set("code_challenge", challenge);
        authorizeUrl.searchParams.set("code_challenge_method", "S256");
        authorizeUrl.searchParams.set("apikey", anonKey);

        window.location.assign(authorizeUrl.toString());
        return { data: { provider: "google", url: authorizeUrl.toString() }, error: null };
      },
      async signOut() {
        await fetch("/auth/signout", { method: "POST" });
        return { error: null };
      }
    }
  };
}

export function createServerClient(supabaseUrl: string, supabaseAnonKey: string, { cookies: cookieHandlers }: { cookies: CookieHandlers }) {
  return {
    auth: {
      async getUser() {
        const { url, anonKey } = resolveConfig(supabaseUrl, supabaseAnonKey);
        const token = cookieHandlers.getAll().find((cookie) => cookie.name === "sb-access-token")?.value;

        if (!token) {
          return { data: { user: null }, error: null };
        }

        const response = await fetch(new URL("/auth/v1/user", url), {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        });

        if (!response.ok) {
          return { data: { user: null }, error: new Error("Invalid session") };
        }

        const user = await response.json();
        return { data: { user }, error: null };
      },
      async exchangeCodeForSession(code: string) {
        const { url, anonKey } = resolveConfig(supabaseUrl, supabaseAnonKey);
        const verifier = cookieHandlers.getAll().find((cookie) => cookie.name === "sb-code-verifier")?.value;

        if (!verifier) {
          return { data: null, error: new Error("Missing PKCE verifier cookie.") };
        }

        const response = await fetch(new URL("/auth/v1/token?grant_type=pkce", url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey
          },
          body: JSON.stringify({ auth_code: code, code_verifier: verifier })
        });

        if (!response.ok) {
          return { data: null, error: new Error("Could not exchange auth code.") };
        }

        const payload = await response.json();
        const secure = shouldUseSecureCookie();

        cookieHandlers.setAll([
          {
            name: "sb-access-token",
            value: payload.access_token,
            options: { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: payload.expires_in }
          },
          {
            name: "sb-refresh-token",
            value: payload.refresh_token,
            options: { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 }
          },
          {
            name: "sb-code-verifier",
            value: "",
            options: { path: "/", maxAge: 0 }
          }
        ]);

        return { data: payload, error: null };
      }
    }
  };
}
