import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

// The SDK documents `export const auth = createNeonAuth({...})` at module scope.
// That cannot be used here: createNeonAuth validates the cookie secret and throws
// during construction, and `next build` evaluates every route module while
// collecting page data — so the documented shape makes the build require secrets a
// build machine has no reason to hold. Constructing on first use keeps the failure
// loud for anyone serving a request, which is the boundary that matters.
let instance: NeonAuth | undefined;
let handler: ReturnType<NeonAuth["handler"]> | undefined;

const ENV_HELP: Record<string, string> = {
  NEON_AUTH_BASE_URL:
    "Run `neon neon-auth status --project-id <meta-project-id>` and copy the base URL.",
  NEON_AUTH_COOKIE_SECRET: "Generate one with `openssl rand -base64 32`.",
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. ${ENV_HELP[name]} See .env.example.`);
  }
  return value;
}

export function getAuth(): NeonAuth {
  if (!instance) {
    instance = createNeonAuth({
      baseUrl: requireEnv("NEON_AUTH_BASE_URL"),
      cookies: { secret: requireEnv("NEON_AUTH_COOKIE_SECRET") },
    });
  }
  return instance;
}

/** The API proxy handler, built once rather than per request. */
export function getAuthHandler(): ReturnType<NeonAuth["handler"]> {
  return (handler ??= getAuth().handler());
}

/**
 * The signed-in user, or null. `auth.getSession()` reports transport failures on
 * `error` instead of throwing, and an unreachable auth server must not read as a
 * signed-out visitor — that would silently bounce a signed-in user to sign-in.
 */
export async function getSessionUser() {
  const { data, error } = await getAuth().getSession();
  if (error) {
    throw new Error(`Failed to read the auth session: ${error.message}`, {
      cause: error,
    });
  }
  return data?.user ?? null;
}
