"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Brand } from "./brand";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CLUB_TYPES,
  CLUB_TYPE_LABELS,
  isClubCategory,
  isJerseySubCategory,
} from "@/lib/constants";
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

  const effectiveCategories: NavCategory[] =
    categories.length > 0
      ? categories
      : [
          { name: "National", slug: "national-teams" },
          { name: "Club", slug: "club-jerseys" },
          { name: "Retro", slug: "retro" },
        ];

  const jerseyNavCategories = effectiveCategories.filter((c) => isJerseySubCategory(c));
  const otherNavCategories = effectiveCategories.filter((c) => !isJerseySubCategory(c));
  const topLevelCategories =
    jerseyNavCategories.length > 0 ? jerseyNavCategories : effectiveCategories.slice(0, 3);
  const dropdownOtherCategories =
    jerseyNavCategories.length > 0 ? otherNavCategories : effectiveCategories.slice(3);

  const tailLinks = [
    { label: "New Arrivals", href: "/shop?sort=newest", highlight: false },
    { label: "Sale", href: "/shop?sort=discount", highlight: true },
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

          <nav className="hidden items-center gap-8 lg:flex">
            <Link
              href="/shop"
              aria-current={isActiveLink("/shop") ? "page" : undefined}
              className={`group relative py-1 text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink ${
                isActiveLink("/shop") ? "text-gold-bright" : "text-paper hover:text-gold"
              }`}
            >
              Shop
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-gold-bright transition-all duration-300 ${
                  isActiveLink("/shop") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>

            {topLevelCategories.map((cat) => {
              const href = `/category/${cat.slug}`;
              const active = pathname === href;
              if (isClubCategory(cat)) {
                return (
                  <DropdownMenu key={cat.slug}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`group relative flex items-center gap-1 py-1 text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink ${
                          active ? "text-gold-bright" : "text-paper hover:text-gold"
                        }`}
                      >
                        {cat.name}
                        <ChevronDown size={13} className="text-paper-dim group-hover:text-gold" />
                        <span
                          className={`absolute -bottom-0.5 left-0 h-px bg-gold-bright transition-all duration-300 ${
                            active ? "w-full" : "w-0 group-hover:w-full"
                          }`}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <Link href={href}>All {cat.name}</Link>
                      </DropdownMenuItem>
                      {CLUB_TYPES.map((type) => (
                        <DropdownMenuItem key={type} asChild>
                          <Link href={`${href}?type=${type}`}>{CLUB_TYPE_LABELS[type]}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={cat.slug}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative py-1 text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink ${
                    active ? "text-gold-bright" : "text-paper hover:text-gold"
                  }`}
                >
                  {cat.name}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-gold-bright transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}

            {dropdownOtherCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`group relative flex items-center gap-1 py-1 text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink ${
                      dropdownOtherCategories.some((c) => pathname === `/category/${c.slug}`)
                        ? "text-gold-bright"
                        : "text-paper hover:text-gold"
                    }`}
                  >
                    Categories
                    <ChevronDown size={13} className="text-paper-dim group-hover:text-gold" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {dropdownOtherCategories.map((cat) => (
                    <DropdownMenuItem key={cat.slug} asChild>
                      <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {tailLinks.map((link) => {
              const active = isActiveLink(link.href);
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                      active
                        ? "border-gold-bright bg-gold-bright text-ink shadow-[0_0_20px_-2px_var(--color-gold-bright)]"
                        : "border-gold-bright/70 bg-gold-bright/15 text-gold-bright shadow-[0_0_16px_-4px_var(--color-gold-bright)] hover:-translate-y-0.5 hover:border-gold-bright hover:bg-gold-bright hover:text-ink hover:shadow-[0_0_22px_-2px_var(--color-gold-bright)] focus-visible:border-gold-bright focus-visible:bg-gold-bright focus-visible:text-ink"
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                          active
                            ? "bg-ink"
                            : "bg-gold-bright group-hover:bg-ink group-focus-visible:bg-ink"
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${
                          active
                            ? "bg-ink"
                            : "bg-gold-bright group-hover:bg-ink group-focus-visible:bg-ink"
                        }`}
                      />
                    </span>
                    {link.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative py-1 text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink ${
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
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="border-b border-ink-border py-4 text-sm font-semibold uppercase tracking-widest"
            >
              Shop
            </Link>

            {effectiveCategories.map((cat) => (
              <div key={cat.slug} className="border-b border-ink-border">
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-4 text-sm font-semibold uppercase tracking-widest"
                >
                  {cat.name}
                </Link>
                {isClubCategory(cat) && (
                  <div className="mb-3 flex flex-wrap gap-2 pl-3">
                    {CLUB_TYPES.map((type) => (
                      <Link
                        key={type}
                        href={`/category/${cat.slug}?type=${type}`}
                        onClick={() => setMobileOpen(false)}
                        className="border border-ink-border px-2.5 py-1 text-xs uppercase tracking-wider text-paper-dim hover:border-gold hover:text-gold"
                      >
                        {CLUB_TYPE_LABELS[type]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {tailLinks.map((link) => {
              const active = isActiveLink(link.href);
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`mt-3 flex items-center justify-between border px-4 py-3.5 text-sm font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                      active
                        ? "border-gold-bright bg-gold-bright text-ink shadow-[0_0_20px_-4px_var(--color-gold-bright)]"
                        : "border-gold-bright/70 bg-gold-bright/15 text-gold-bright hover:border-gold-bright hover:bg-gold-bright hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                            active ? "bg-ink" : "bg-gold-bright"
                          }`}
                        />
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${
                            active ? "bg-ink" : "bg-gold-bright"
                          }`}
                        />
                      </span>
                      {link.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                        active ? "bg-ink text-gold-bright" : "bg-gold-bright text-ink"
                      }`}
                    >
                      HOT
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-ink-border py-4 text-sm font-semibold uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright"
                >
                  {link.label}
                </Link>
              );
            })}
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
