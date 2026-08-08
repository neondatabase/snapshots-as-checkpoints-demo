import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

// Managed Better Auth is constructed on first use rather than at import time.
// `next build` evaluates every route module while collecting page data, and a
// build machine has no reason to hold auth secrets.
let instance: NeonAuth | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Run \`neon neon-auth status\` against the meta database project for NEON_AUTH_BASE_URL, and \`openssl rand -base64 32\` for NEON_AUTH_COOKIE_SECRET. See .env.example.`,
    );
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

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * The signed-in user, or null. `auth.getSession()` reports transport failures on
 * `error` instead of throwing, and an unreachable auth server must not read as a
 * signed-out visitor.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { data, error } = await getAuth().getSession();
  if (error) {
    throw new Error(`Failed to read the auth session: ${error.message}`, {
      cause: error,
    });
  }
  const user = data?.user;
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name ?? null };
}
