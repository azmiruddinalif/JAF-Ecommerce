import { clerkMiddleware } from "@clerk/nextjs/server";

// Populates Clerk's auth context (used by `auth()`/`currentUser()`) for every
// /admin request. The actual gate is resource-based, per Clerk's current
// guidance: `admin/(dashboard)/layout.tsx` redirects unauthenticated/
// non-admin visitors, and every admin server action independently re-checks
// via `requireAdminSession()` — defense in depth, not path-matching alone.
export const proxy = clerkMiddleware();

export const config = {
  matcher: ["/admin/:path*"],
};
