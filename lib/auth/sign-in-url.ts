export const SIGN_IN_PATH = "/auth/sign-in";

/**
 * The sign-in URL, carrying where to return to afterwards. `@neondatabase/auth-ui`
 * reads the `redirectTo` search param on success and otherwise falls back to "/".
 */
export function signInUrl(returnTo?: string): string {
  if (!returnTo || returnTo === "/") return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?redirectTo=${encodeURIComponent(returnTo)}`;
}
