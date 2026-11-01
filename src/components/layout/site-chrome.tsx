"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

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

  useEffect(() => {
    if (isAdmin) {
      document.documentElement.classList.add("admin-theme");
      document.body.classList.add("admin-theme");
      document.documentElement.setAttribute("data-theme", "admin");
    } else {
      document.documentElement.classList.remove("admin-theme");
      document.body.classList.remove("admin-theme");
      document.documentElement.removeAttribute("data-theme");
    }
  }, [isAdmin]);

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
