"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Newspaper, FileText, Settings, LogOut, Menu } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActiveLink(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function SidebarBrand() {
  return (
    <div>
      <span className="font-display text-xl text-paper">JAF</span>
      <p className="text-[11px] uppercase tracking-widest text-paper-dim">Admin Panel</p>
    </div>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-6">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActiveLink(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-gold-bright bg-ink text-gold font-medium"
                : "border-transparent text-paper hover:bg-ink hover:text-gold"
            )}
          >
            <Icon size={16} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ adminName }: { adminName: string }) {
  return (
    <div className="border-t border-ink-border px-6 py-5">
      <p className="mb-3 truncate text-xs text-paper-dim">Signed in as {adminName}</p>
      <SignOutButton redirectUrl="/admin/login">
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-dim hover:text-danger"
        >
          <LogOut size={14} /> Log out
        </button>
      </SignOutButton>
    </div>
  );
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-border bg-ink-raised px-4 py-4 lg:hidden">
        <SidebarBrand />
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-paper">
          <Menu size={22} />
        </button>
      </header>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-border bg-ink-raised lg:flex">
        <div className="border-b border-ink-border px-6 py-6">
          <SidebarBrand />
        </div>
        <SidebarNav pathname={pathname} />
        <SidebarFooter adminName={adminName} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" aria-describedby={undefined} className="flex w-72 flex-col p-0 lg:hidden">
          <SheetHeader>
            <SheetTitle>
              <SidebarBrand />
            </SheetTitle>
          </SheetHeader>
          <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter adminName={adminName} />
        </SheetContent>
      </Sheet>
    </>
  );
}
