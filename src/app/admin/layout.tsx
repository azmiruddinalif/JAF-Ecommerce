import type { Metadata } from "next";
import { AdminThemeEffect } from "@/components/admin/admin-theme-effect";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminThemeEffect />
      {children}
    </>
  );
}
