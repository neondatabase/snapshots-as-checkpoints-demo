import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/server";

// The auth server rotates the session cookie periodically and the SDK writes the new
// value through next/headers. Next forbids that during a Server Component render, so
// the rotation has to be consumed here, before the page renders.
export default async function proxy(request: NextRequest) {
  return getAuth().middleware({ loginUrl: "/auth/sign-in" })(request);
}

// The middleware redirects any matched path that it does not already skip, so the
// matcher is what decides which routes are protected.
//
// `/` is public but still reads the session, so it is matched only when a session
// cookie is present: signed-in visitors get their cookie refreshed, and anonymous
// ones never reach the middleware, so they are never redirected off the landing page.
//
// The action routes under /api are deliberately absent. They answer 401 JSON, and a
// redirect would hand their callers an HTML document instead.
export const config = {
  matcher: [
    {
      source: "/",
      has: [{ type: "cookie", key: "__Secure-neon-auth.session_token" }],
    },
    "/:checkpointId([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
  ],
};
