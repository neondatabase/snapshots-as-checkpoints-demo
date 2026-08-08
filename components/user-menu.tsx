"use client";

import { UserButton } from "@neondatabase/auth-ui";

// disableDefaultLinks drops the built-in Settings entry, which points at an account
// area this demo does not route. Sign Out is unaffected.
export function UserMenu() {
  return <UserButton size="icon" disableDefaultLinks />;
}
