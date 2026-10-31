"use client";

import { useEffect, useState } from "react";
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
  const [signingOut, setSigningOut] = useState(true);

  useEffect(() => {
    let active = true;
    void signOut({ redirectUrl: "/admin/login?reason=not-admin" }).catch(() => {
      if (active) setSigningOut(false);
    });
    return () => {
      active = false;
    };
  }, [signOut]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-ink-border bg-ink-raised p-6 text-center">
      {signingOut ? (
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold-bright border-t-transparent" />
      ) : null}
      <p className="text-sm text-paper-dim">
        You&apos;re signed in with an account that isn&apos;t the JAF admin. Signing out…
      </p>
      <button
        type="button"
        onClick={() => void signOut({ redirectUrl: "/admin/login" })}
        className="mt-2 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:underline"
      >
        Click here to force sign out
      </button>
    </div>
  );
}
