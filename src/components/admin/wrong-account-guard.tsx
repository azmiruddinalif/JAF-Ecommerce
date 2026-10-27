"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

/**
 * Renders when a visitor has a valid Clerk session that isn't the admin
 * account (ADMIN_EMAIL). Clerk's <SignIn> refuses to render for an
 * already-signed-in user and redirects to `fallbackRedirectUrl` instead —
 * which would just bounce back here forever, since the dashboard layout
 * rejects that same session. Signing out first breaks the loop.
 */
export function WrongAccountGuard() {
  const { signOut } = useClerk();

  useEffect(() => {
    // The query flag lets the login page explain why the visitor landed back
    // on it, instead of silently showing the sign-in form again.
    void signOut({ redirectUrl: "/admin/login?reason=not-admin" });
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-center">
      <p className="text-sm text-paper-dim">
        You&apos;re signed in with an account that isn&apos;t the JAF admin. Signing out…
      </p>
    </div>
  );
}
