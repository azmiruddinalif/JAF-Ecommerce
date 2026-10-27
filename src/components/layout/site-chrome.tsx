"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The admin dashboard renders its own full-height chrome (sidebar, or the
 * split-screen login panel) and shouldn't sit under the storefront's
 * announcement bar / nav / footer.
 */
export function SiteChrome({
  announcementBar,
  navbar,
  footer,
  children,
}: {
  announcementBar: ReactNode;
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {announcementBar}
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
