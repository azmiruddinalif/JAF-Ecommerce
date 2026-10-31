import { clerkMiddleware } from "@clerk/nextjs/server";

// Populates Clerk's auth context (used by `auth()`/`currentUser()`)
// The actual gate is resource-based: `admin/(dashboard)/layout.tsx` redirects
// unauthenticated/non-admin visitors, and every admin server action independently
// re-checks via `requireAdminSession()`.
const middleware = clerkMiddleware();

export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    // Standard Clerk matcher: intercepts app routes & auth handshakes while skipping static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
