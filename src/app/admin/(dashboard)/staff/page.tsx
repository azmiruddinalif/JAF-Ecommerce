import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getStaffListAction } from "@/lib/actions/admin-staff-actions";
import { StaffManager } from "@/components/admin/staff-manager";

export const metadata: Metadata = {
  title: "Staff & Roles | JAF Admin",
  robots: { index: false },
};

export const instant = false;

export default async function AdminStaffPage() {
  const session = await getAdminSession();

  // Only users with 'staff:manage' permission (Owner) may access this hub
  if (!session || !hasPermission(session.role, "staff:manage")) {
    redirect("/admin");
  }

  const staff = await getStaffListAction();

  return <StaffManager initialStaff={staff} currentUserId={session.userId} />;
}
