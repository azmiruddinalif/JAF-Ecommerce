"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Plus, Search, Store } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function AdminHeader({
  adminName,
}: {
  adminName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (pathname.includes("/orders")) {
      router.push(`/admin/orders?query=${encodeURIComponent(q)}`);
    } else {
      router.push(`/admin/products?query=${encodeURIComponent(q)}`);
    }
  }

  return (
    <header className="sticky top-0 z-20 hidden h-16 border-b border-slate-200/90 bg-white/95 px-6 backdrop-blur-md min-[1200px]:flex min-[1200px]:items-center min-[1200px]:justify-between">
      {/* Global Admin Search Bar */}
      <form onSubmit={handleSearch} className="relative w-80 lg:w-96">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products, orders, stocks..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* View Live Store */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <Store size={14} className="text-emerald-600" />
          <span>Live Store</span>
          <ExternalLink size={12} className="text-slate-400" />
        </Link>

        {/* Quick Add Product Button */}
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-95"
        >
          <Plus size={14} />
          <span>Add Product</span>
        </Link>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Profile Card */}
        <div className="flex items-center gap-2.5">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 rounded-full border border-slate-200 shadow-2xs",
              },
            }}
          />
          <div className="text-left">
            <p className="text-xs font-semibold leading-tight text-slate-900 truncate max-w-32">
              {adminName}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">Store Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}

