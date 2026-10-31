import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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

  // The page itself is the only scroll container; the sidebar is sticky so it
  // stays put without needing its own nested scroll area.
  return (
    <div className="flex min-h-dvh flex-col bg-ink lg:flex-row">
      <AdminSidebar adminName={session.name} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
