"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Loader2,
  Menu,
  Plus,
  Download,
  ExternalLink,
  Smartphone,
  X,
  Store,
  ChevronDown,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/auth/auth-client";
import { adminSignOutAction } from "@/lib/actions/admin-auth-actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PwaInstallGuideModal,
  usePwaInstall,
} from "@/components/admin/pwa-install-button";
import { cn } from "@/lib/cn";

interface NavGroup {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/stocks", label: "Product Stocks", icon: Boxes },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "CONTENT & MARKETING",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/admin/staff", label: "Staff & Roles", icon: Users },
      { href: "/admin/settings", label: "Store Settings", icon: Settings },
    ],
  },
];

const allLinks = navGroups.flatMap((g) => g.items);

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
  const matched = allLinks.find((l) => isActiveLink(pathname, l.href));
  return matched ? matched.label : "Admin Panel";
}

function SidebarBrand() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-display text-sm font-bold text-white shadow-xs">
          JAF
        </div>
        <div className="text-left">
          <span className="block font-display text-sm font-bold leading-none tracking-wide text-slate-900">
            JAF ATHLETICS
          </span>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Official Store Admin</p>
        </div>
      </div>
      <ChevronDown size={14} className="text-slate-400" />
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
    <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {group.label}
          </p>
          <div className="space-y-0.5 pt-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActiveLink(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                    active
                      ? "bg-emerald-50/90 font-semibold text-emerald-800 shadow-2xs border border-emerald-100"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={16}
                      className={active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* SALES CHANNELS */}
      <div className="space-y-1 border-t border-slate-200/80 pt-4">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Sales Channels
        </p>
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
        >
          <div className="flex items-center gap-2.5">
            <Store size={16} className="text-slate-400" />
            <span>Online Store</span>
          </div>
          <ExternalLink size={13} className="text-slate-400" />
        </Link>
      </div>

      <div className="space-y-2 border-t border-slate-200/80 pt-4">
        <Link
          href="/admin/products/new"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-95"
        >
          <Plus size={15} />
          <span>New Product</span>
        </Link>

        {canInstall && (
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onInstall();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Install App</span>
          </button>
        )}
      </div>
    </nav>
  );
}

function SidebarFooter({
  adminName,
  role = "support",
}: {
  adminName: string;
  role?: string;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await Promise.allSettled([signOut(), adminSignOutAction()]);
    } catch {
      // ignore
    } finally {
      window.location.href = "/admin/login";
    }
  }

  const roleTitle = role === "owner" ? "Store Owner" : role.replace("_", " ");

  return (
    <div className="border-t border-slate-200/80 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <p className="truncate text-xs font-semibold text-slate-900">{adminName}</p>
          <p className="text-[10px] text-slate-500 capitalize">{roleTitle}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={isLoggingOut ? "Signing out..." : "Sign out"}
          aria-label={isLoggingOut ? "Signing out..." : "Sign out"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 size={14} className="animate-spin text-rose-600" />
          ) : (
            <LogOut size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({ adminName, role = "support" }: { adminName: string; role?: string }) {
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
  const isMoreActive = allLinks.slice(4).some((l) => isActiveLink(pathname, l.href));

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md min-[1200px]:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-display text-xs font-bold text-white">
              JAF
            </div>
            <div>
              <p className="font-display text-sm leading-none font-bold tracking-wide text-slate-900">
                {currentTitle.toUpperCase()}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
                Store Admin
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/products/new"
              aria-label="Add Product"
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white active:scale-95 shadow-xs"
            >
              <Plus size={14} />
              <span>Add</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 active:scale-95 shadow-2xs"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>

        {/* Mobile PWA Install Banner */}
        {canInstall && !bannerDismissed && (
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-emerald-50 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-emerald-900">
              <Smartphone size={14} className="shrink-0 text-emerald-600" />
              <span className="truncate">Install JAF Admin App for 1-tap mobile access</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={triggerInstall}
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                <Download size={11} />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss banner"
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Sidebar (Clean White SaaS Design) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white min-[1200px]:flex">
        <div className="border-b border-slate-200/80 p-4">
          <SidebarBrand />
        </div>
        <SidebarNav
          pathname={pathname}
          canInstall={canInstall}
          onInstall={triggerInstall}
        />
        <SidebarFooter adminName={adminName} role={role} />
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Admin mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md min-[1200px]:hidden"
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
                  "relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wider transition-colors active:scale-95",
                  active ? "text-emerald-600" : "text-slate-500 hover:text-slate-900",
                )}
              >
                {active && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-emerald-600" />
                )}
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wider transition-colors active:scale-95",
              isMoreActive || mobileOpen
                ? "text-emerald-600"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            {(isMoreActive || mobileOpen) && (
              <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-emerald-600" />
            )}
            <Menu size={18} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Mobile Menu Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="flex w-72 flex-col p-0 bg-white min-[1200px]:hidden"
        >
          <SheetHeader className="border-b border-slate-200 p-4">
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
          <SidebarFooter adminName={adminName} role={role} />
        </SheetContent>
      </Sheet>

      <PwaInstallGuideModal
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
}
