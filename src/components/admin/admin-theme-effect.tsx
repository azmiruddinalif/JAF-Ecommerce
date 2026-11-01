"use client";

import { useEffect } from "react";

/**
 * Ensures document.documentElement (html) and document.body receive the
 * `admin-theme` class while browsing any route under /admin.
 *
 * This is critical because Radix UI popovers, select dropdowns, dialogs, and
 * tooltips render via React Portals into `document.body` outside of the
 * page container. With `admin-theme` on body, all portaled overlays inherit
 * pure white backgrounds, clean slate borders, and readable high-contrast text.
 */
export function AdminThemeEffect() {
  useEffect(() => {
    document.documentElement.classList.add("admin-theme");
    document.body.classList.add("admin-theme");
    document.documentElement.setAttribute("data-theme", "admin");

    return () => {
      document.documentElement.classList.remove("admin-theme");
      document.body.classList.remove("admin-theme");
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  return null;
}

