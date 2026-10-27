import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ShieldCheck } from "lucide-react";
import { Brand, BrandSlogan } from "@/components/layout/brand";
import { getAdminSession } from "@/lib/auth/session";
import { WrongAccountGuard } from "@/components/admin/wrong-account-guard";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false },
};

// Clerk's <SignIn> reads the current path client-side for its own routing —
// inherently dynamic, same as the rest of the session-gated admin area.
export const instant = false;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth();
  const session = userId ? await getAdminSession() : null;
  const signedInWithWrongAccount = Boolean(userId) && !session;
  const rejectedNonAdmin = (await searchParams).reason === "not-admin";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden below lg, where the form alone fills the screen */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-raised px-12 py-12 lg:flex">
        <span
          aria-hidden
          className="font-display pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 text-[28rem] leading-none text-paper/5"
        >
          JAF
        </span>

        <div className="relative z-10">
          <Brand size="lg" className="items-start [&_span]:text-paper [&_span]:hover:text-gold-bright" />
          <BrandSlogan className="mt-3 text-gold-bright" />
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="flex items-center gap-2 text-gold-bright">
            <ShieldCheck size={18} strokeWidth={2} />
            <p className="text-xs font-semibold uppercase tracking-widest">Restricted access</p>
          </div>
          <p className="text-sm leading-relaxed text-paper-dim">
            This panel is reserved for a single, dedicated JAF administrator account. Every sign-in
            is verified and session-checked on every request.
          </p>
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center bg-ink px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <Brand className="mx-auto items-center" />
          </div>
          <div className="mb-8 text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">Admin Panel</p>
            <h1 className="font-display mt-2 text-3xl text-paper">Sign in</h1>
            <p className="mt-2 text-sm text-paper-dim">Enter your administrator credentials to continue.</p>
          </div>
          {rejectedNonAdmin && !signedInWithWrongAccount && (
            <p
              role="alert"
              className="mb-6 border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300"
            >
              That account isn&apos;t the JAF admin. Sign in with the administrator email and
              password instead.
            </p>
          )}
          {signedInWithWrongAccount ? (
            <WrongAccountGuard />
          ) : (
            <SignIn
              routing="path"
              path="/admin/login"
              fallbackRedirectUrl="/admin"
              signUpUrl="/admin/login"
              appearance={{
                variables: {
                  colorPrimary: "#4ade80",
                  colorPrimaryForeground: "#0a0b09",
                  colorBackground: "#0a0b09",
                  colorForeground: "#eef2ea",
                  colorMutedForeground: "#8d9589",
                  colorInput: "#121410",
                  colorInputForeground: "#eef2ea",
                  colorBorder: "#262b22",
                  colorDanger: "#f87171",
                  borderRadius: "0px",
                  fontFamily: "var(--font-sans)",
                },
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-none border border-ink-border p-6 sm:p-8",
                  header: "!hidden",
                  // Single-admin, email + password only — no social sign-in.
                  socialButtons: "!hidden",
                  dividerRow: "!hidden",
                  formFieldLabel: "text-xs font-semibold uppercase tracking-wider text-paper-dim",
                  formFieldInput: "border border-ink-border focus:border-gold-bright focus:ring-gold-bright/20",
                  formButtonPrimary:
                    "bg-gold-bright hover:bg-gold-dim text-ink text-sm font-semibold uppercase tracking-wider normal-case",
                  footerAction: "text-paper-dim",
                  footer: "!hidden",
                  identityPreviewText: "text-paper",
                  identityPreviewEditButtonIcon: "text-gold-bright",
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
