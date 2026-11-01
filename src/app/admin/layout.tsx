import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

// The PWA manifest is attached only to /admin so "Download App" installs the
// admin panel, not the public storefront.
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JAF Admin",
  },
};

// Clerk is scoped to /admin only — the storefront never depends on it, so a
// missing/misconfigured Clerk key can only ever break the admin area.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
