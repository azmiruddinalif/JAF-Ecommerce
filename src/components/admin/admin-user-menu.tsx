"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";
import { ROLE_LABELS, type AdminRole } from "@/lib/auth/permissions";

export function AdminUserMenu({
  adminName,
  role = "support",
  email,
}: {
  adminName: string;
  role?: string;
  email?: string;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const roleMeta = ROLE_LABELS[role as AdminRole] ?? ROLE_LABELS.support;
  const initials = adminName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "A";

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User profile and menu"
          className="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 transition-colors hover:border-slate-200 hover:bg-white text-left outline-none"
        >
          {/* Avatar Pill */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-display text-xs font-bold text-white shadow-xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="max-w-32 truncate text-xs font-semibold leading-tight text-slate-900">
              {adminName}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight capitalize">
              {roleMeta.title}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2">
        {/* User Identity info */}
        <div className="border-b border-slate-100 px-3 py-2.5 mb-1">
          <p className="text-xs font-bold text-slate-900 truncate">{adminName}</p>
          {email && <p className="text-[11px] text-slate-500 truncate">{email}</p>}
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${roleMeta.badgeColor}`}>
              <ShieldCheck size={11} />
              {roleMeta.title}
            </span>
          </div>
        </div>

        {/* Links */}
        {role === "owner" && (
          <DropdownMenuItem asChild>
            <Link href="/admin/staff" className="flex items-center gap-2 py-2 text-xs font-medium normal-case text-slate-700 hover:text-emerald-700">
              <Users size={14} className="text-slate-400" />
              <span>Staff &amp; Roles</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/admin/settings" className="flex items-center gap-2 py-2 text-xs font-medium normal-case text-slate-700 hover:text-emerald-700">
            <Settings size={14} className="text-slate-400" />
            <span>Store Settings</span>
          </Link>
        </DropdownMenuItem>

        <div className="my-1 border-t border-slate-100" />

        {/* Sign Out Action */}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2 py-2 text-xs font-medium normal-case text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
        >
          <LogOut size={14} className="text-rose-500" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
