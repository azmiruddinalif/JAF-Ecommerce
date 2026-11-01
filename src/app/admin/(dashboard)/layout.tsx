import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

// The entire admin dashboard is session-gated and inherently dynamic —
// it never needs (or can produce) a static shell.
export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-dashboard flex min-h-dvh flex-col bg-slate-50 text-slate-900 min-[1200px]:flex-row">
      <AdminSidebar adminName={session.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader adminName={session.name} />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 min-[1200px]:px-8 min-[1200px]:py-6">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
