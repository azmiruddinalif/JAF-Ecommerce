import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  ExternalLink,
  Shield,
  ShoppingBag,
  Sparkles,
  Users2,
} from "lucide-react";
import { Brand, BrandSlogan } from "@/components/layout/brand";
import { getAdminSession } from "@/lib/auth/session";
import { AdminSignInForm } from "@/components/admin/admin-sign-in-form";

export const metadata: Metadata = {
  title: "Admin & Staff Sign In | JAF",
  robots: { index: false },
};

export const instant = false;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const session = await getAdminSession();

  // If already authenticated with a valid session, redirect directly to dashboard
  if (session) {
    const params = await searchParams;
    const returnUrl =
      typeof params.returnUrl === "string" ? params.returnUrl : "/admin";
    redirect(returnUrl);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:grid lg:grid-cols-12">
      {/* Brand Hero Panel — visible on desktop (5 cols) */}
      <div className="relative hidden lg:col-span-5 lg:flex flex-col justify-between overflow-hidden border-r border-slate-200/80 bg-white p-10 xl:p-14">
        {/* Subtle Decorative Ambient Background */}
        <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-size-[20px_20px] opacity-40" />

        {/* Top Header: Brand & Slogan */}
        <div className="relative z-10">
          <Brand size="lg" className="items-start" />
          <BrandSlogan className="mt-2.5 text-xs font-serif italic text-emerald-700 font-semibold tracking-wider" />
        </div>

        {/* Center Feature Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
            <Sparkles size={13} className="text-emerald-600" />
            <span>Store Operations Console</span>
          </div>

          <h2 className="mt-4 text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.2]">
            Command Center for Football Fashion
          </h2>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-sm">
            Administrative hub to fulfill matchday orders, update jersey
            inventories, inspect sales metrics, and manage multi-role staff
            access.
          </p>

          {/* Feature Mini Cards */}
          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                <ShoppingBag size={17} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Order Fulfilment &amp; Invoices
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Manage orders, print invoices, and safeguard 100% guest-only
                  checkout privacy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                <Boxes size={17} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Live Size &amp; Stock Matrix
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Real-time stock controls for Club, Retro &amp; National
                  jerseys across sizes S to 3XL.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                <Users2 size={17} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Multi-Role Staff RBAC
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Owner, Order Manager, Product Manager &amp; Support roles with
                  instant session revocation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Status */}
        <div className="relative z-10 border-t border-slate-200/80 pt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-emerald-600" />
            <span className="font-semibold text-slate-700">
              Better Auth Engine
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px]">256-Bit SSL</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Online</span>
          </div>
        </div>
      </div>

      {/* Right Column: Sign-In Panel (7 cols desktop, full width on mobile) */}
      <div className="relative flex-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between w-full">
          {/* Mobile Brand Header */}
          <div className="lg:hidden">
            <Brand size="sm" />
          </div>

          <div className="hidden lg:block">
            <span className="text-xs font-medium text-slate-400">
              JAF Admin Console
            </span>
          </div>

          {/* Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Live Storefront</span>
            <ExternalLink size={12} className="text-slate-400" />
          </Link>
        </div>

        {/* Centered Form */}
        <div className="my-auto flex flex-col items-center justify-center py-8">
          <AdminSignInForm />
        </div>

        {/* Bottom Mobile/Desktop Footer */}
        <div className="pt-6 text-center text-xs text-slate-400">
          <p>© 2026 JAF Jersey. Store Operations &amp; Staff Gateway.</p>
        </div>
      </div>
    </div>
  );
}
