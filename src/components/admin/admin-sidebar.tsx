"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  FolderTree,
  ShoppingCart,
  Newspaper,
  FileText,
  Settings,
  LogOut,
  Menu,
  Plus,
  Download,
  ExternalLink,
  Smartphone,
  X,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PwaInstallGuideModal,
  usePwaInstall,
} from "@/components/admin/pwa-install-button";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", shortLabel: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", shortLabel: "Products", icon: Package },
  { href: "/admin/stocks", label: "Product Stocks", shortLabel: "Stocks", icon: Boxes },
  { href: "/admin/categories", label: "Categories", shortLabel: "Categories", icon: FolderTree },
  { href: "/admin/blog", label: "Blog", shortLabel: "Blog", icon: Newspaper },
  { href: "/admin/pages", label: "Pages", shortLabel: "Pages", icon: FileText },
  { href: "/admin/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

const primaryMobileTabs = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/stocks", label: "Stocks", icon: Boxes },
];

function isActiveLink(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function getPageTitle(pathname: string): string {
  if (pathname === "/admin/products/new") return "New Product";
  if (pathname.startsWith("/admin/products/")) return "Edit Product";
  if (pathname.startsWith("/admin/orders/")) return "Order Details";
  const matched = links.find((l) => isActiveLink(pathname, l.href));
  return matched ? matched.label : "Admin Panel";
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center border border-gold/40 bg-gold-bright/15 font-display text-sm text-gold-bright">
        JAF
      </div>
      <div>
        <span className="font-display text-lg leading-none text-paper">JAF ADMIN</span>
        <p className="text-[10px] uppercase tracking-widest text-paper-dim">Store Manager</p>
      </div>
    </div>
  );
}

function SidebarNav({
  pathname,
  canInstall,
  onInstall,
  onNavigate,
}: {
  pathname: string;
  canInstall: boolean;
  onInstall: () => void;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
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
              "flex items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors",
              active
                ? "border-gold-bright bg-ink font-medium text-gold-bright"
                : "border-transparent text-paper hover:bg-ink hover:text-gold",
            )}
          >
            <Icon size={17} />
            {link.label}
          </Link>
        );
      })}

      <div className="my-4 space-y-2 border-t border-ink-border pt-3">
        <Link
          href="/admin/products/new"
          onClick={onNavigate}
          className="flex items-center gap-3 border border-gold/40 bg-gold/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold-bright transition-colors hover:bg-gold-bright hover:text-ink"
        >
          <Plus size={15} />
          Add New Product
        </Link>

        {canInstall && (
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onInstall();
            }}
            className="flex w-full items-center gap-3 border border-gold-bright/60 bg-gold-bright px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-gold"
          >
            <Download size={15} />
            Download Admin App
          </button>
        )}

        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper-dim transition-colors hover:text-gold"
        >
          <ExternalLink size={15} />
          View Live Storefront
        </Link>
      </div>
    </nav>
  );
}

function SidebarFooter({
  adminName,
  canInstall,
  onInstall,
}: {
  adminName: string;
  canInstall: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="border-t border-ink-border px-5 py-4">
      {canInstall && (
        <button
          type="button"
          onClick={onInstall}
          className="mb-3 flex w-full items-center justify-center gap-2 border border-gold-bright/60 bg-gold-bright/15 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-bright transition-colors hover:bg-gold-bright hover:text-ink"
        >
          <Download size={14} /> Download Admin App
        </button>
      )}
      <p className="mb-2.5 truncate text-xs text-paper-dim">Signed in as {adminName}</p>
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
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { isStandalone, showGuideModal, setShowGuideModal, triggerInstall } = usePwaInstall();

  useEffect(() => {
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k.startsWith("jaf-admin-pwa"))
              .map((k) => caches.delete(k)),
          ),
        )
        .catch(() => {});
    }
  }, []);

  const canInstall = !isStandalone;
  const currentTitle = getPageTitle(pathname);
  const isMoreActive = links
    .slice(4)
    .some((l) => isActiveLink(pathname, l.href));

  return (
    <>
      {/* Mobile App Top Header */}
      <header className="sticky top-0 z-30 border-b border-ink-border bg-ink/95 pt-[env(safe-area-inset-top)] backdrop-blur-md min-[1200px]:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-gold/50 bg-gold-bright/15 font-display text-xs text-gold-bright">
              JAF
            </div>
            <div>
              <p className="font-display text-sm leading-none tracking-wide text-paper">
                {currentTitle.toUpperCase()}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-gold-bright">
                Admin App
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                type="button"
                onClick={triggerInstall}
                aria-label="Download Admin App"
                className="inline-flex h-9 items-center gap-1.5 border border-gold-bright/60 bg-gold-bright/15 px-2.5 text-[11px] font-bold uppercase tracking-wider text-gold-bright active:scale-95"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            )}
            <Link
              href="/admin/products/new"
              aria-label="Add Product"
              className="inline-flex h-9 items-center gap-1 bg-gold-bright px-2.5 text-[11px] font-bold uppercase tracking-wider text-ink active:scale-95"
            >
              <Plus size={14} />
              <span>Add</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center border border-ink-border bg-ink-raised text-paper active:scale-95"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile PWA Install Banner */}
        {canInstall && !bannerDismissed && (
          <div className="flex items-center justify-between gap-2 border-t border-ink-border bg-ink-raised px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-paper">
              <Smartphone size={14} className="shrink-0 text-gold-bright" />
              <span className="truncate">Download JAF Admin App for 1-tap store management</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={triggerInstall}
                className="inline-flex items-center gap-1 bg-gold-bright px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink"
              >
                <Download size={11} />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss install banner"
                className="text-paper-dim hover:text-paper"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-border bg-ink-raised min-[1200px]:flex">
        <div className="border-b border-ink-border px-6 py-5">
          <SidebarBrand />
        </div>
        <SidebarNav
          pathname={pathname}
          canInstall={canInstall}
          onInstall={triggerInstall}
        />
        <SidebarFooter
          adminName={adminName}
          canInstall={canInstall}
          onInstall={triggerInstall}
        />
      </aside>

      {/* Mobile Bottom App Tab Bar */}
      <nav
        aria-label="Admin mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-border bg-ink-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md min-[1200px]:hidden"
      >
        <div className="grid h-16 grid-cols-5">
          {primaryMobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActiveLink(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors active:scale-95",
                  active ? "text-gold-bright" : "text-paper-dim hover:text-paper",
                )}
              >
                {active && (
                  <span className="absolute inset-x-3 top-0 h-0.5 bg-gold-bright" />
                )}
                <Icon size={19} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors active:scale-95",
              isMoreActive || mobileOpen
                ? "text-gold-bright"
                : "text-paper-dim hover:text-paper",
            )}
          >
            {(isMoreActive || mobileOpen) && (
              <span className="absolute inset-x-3 top-0 h-0.5 bg-gold-bright" />
            )}
            <Menu size={19} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Full Menu Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="flex w-72 flex-col p-0 min-[1200px]:hidden"
        >
          <SheetHeader className="border-b border-ink-border px-5 py-4">
            <SheetTitle>
              <SidebarBrand />
            </SheetTitle>
          </SheetHeader>
          <SidebarNav
            pathname={pathname}
            canInstall={canInstall}
            onInstall={triggerInstall}
            onNavigate={() => setMobileOpen(false)}
          />
          <SidebarFooter
            adminName={adminName}
            canInstall={canInstall}
            onInstall={() => {
              setMobileOpen(false);
              void triggerInstall();
            }}
          />
        </SheetContent>
      </Sheet>

      <PwaInstallGuideModal
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
}
