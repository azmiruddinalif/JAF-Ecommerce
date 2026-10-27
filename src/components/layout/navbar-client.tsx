"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Brand } from "./brand";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CartView } from "@/lib/cart/read";

export interface NavCategory {
  name: string;
  slug: string;
}

export function NavbarClient({
  categories,
  cart,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
}: {
  categories: NavCategory[];
  cart: CartView;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navLinks = [
    { label: "Shop", href: "/shop" },
    { label: "Clubs", href: "/category/club-jerseys" },
    { label: "National Teams", href: "/category/national-teams" },
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Sale", href: "/shop?sort=discount" },
  ];

  function isActiveLink(href: string) {
    const [hrefPath, hrefQuery] = href.split("?");
    if (pathname !== hrefPath) return false;
    const hrefSort = new URLSearchParams(hrefQuery).get("sort");
    return hrefSort ? searchParams.get("sort") === hrefSort : !searchParams.get("sort");
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = form.get("q")?.toString().trim();
    setSearchOpen(false);
    router.push(q ? `/shop?query=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-30">
      <div className="border-b border-ink-border bg-ink/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-4">
            <button
              type="button"
              className="text-paper lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div className="hidden lg:flex">
              <Brand />
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden">
            <Brand />
          </div>

          <nav className="hidden items-center gap-9 lg:flex">
            {navLinks.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative py-1 text-xs font-semibold uppercase tracking-widest transition-colors ${
                    active ? "text-gold-bright" : "text-paper hover:text-gold"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-gold-bright transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-5">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="text-paper hover:text-gold"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative text-paper hover:text-gold"
            >
              <ShoppingBag size={20} />
              {cart.itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold-bright text-[10px] font-bold text-ink">
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-ink-border bg-ink-raised px-4 py-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-3xl items-center gap-3">
              <Search size={18} className="text-paper-dim" />
              <input
                name="q"
                autoFocus
                placeholder="Search for jerseys, teams, players..."
                className="w-full bg-transparent text-sm text-paper placeholder:text-paper-dim focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X size={18} className="text-paper-dim hover:text-gold" />
              </button>
            </form>
          </div>
        )}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" aria-describedby={undefined} className="p-0 lg:hidden">
          <SheetHeader>
            <SheetTitle>
              <Brand size="sm" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-ink-border py-4 text-sm font-semibold uppercase tracking-widest"
              >
                {link.label}
              </Link>
            ))}
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="border-b border-ink-border py-4 text-sm uppercase tracking-wide text-paper-dim"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        deliveryFeeCents={deliveryFeeCents}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
      />
    </header>
  );
}
