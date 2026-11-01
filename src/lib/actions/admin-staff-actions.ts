"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/session";
import { hashPassword } from "better-auth/crypto";
import {
  type AdminRole,
  isValidAdminRole,
  ROLE_LABELS,
} from "@/lib/auth/permissions";

export interface StaffActionResult {
  success: boolean;
  message: string;
}

export interface StaffMemberRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  activeSessionCount: number;
}

/**
 * Lists all staff members in the store.
 * Requires `staff:manage` permission (Owner only).
 */
export async function getStaffListAction(): Promise<StaffMemberRow[]> {
  await requirePermission("staff:manage");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        where: {
          expiresAt: { gt: new Date() },
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: (isValidAdminRole(u.role) ? u.role : "support") as AdminRole,
    banned: Boolean(u.banned),
    banReason: u.banReason,
    createdAt: u.createdAt.toISOString(),
    activeSessionCount: u.sessions.length,
  }));
}

/**
 * Provisions a new staff member account.
 * Requires `staff:manage` permission (Owner only).
 */
export async function provisionStaffAction(formData: FormData): Promise<StaffActionResult> {
  await requirePermission("staff:manage");

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const name = formData.get("name")?.toString().trim();
  const role = formData.get("role")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !name || !role || !password) {
    return { success: false, message: "All fields (name, email, role, password) are required." };
  }

  if (!isValidAdminRole(role)) {
    return { success: false, message: "Invalid role selected." };
  }

  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: "An account with this email address already exists." };
  }

  try {
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          role,
          emailVerified: true,
          banned: false,
        },
      });

      await tx.account.create({
        data: {
          userId: newUser.id,
          accountId: newUser.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      message: `Staff member ${name} (${ROLE_LABELS[role as AdminRole].title}) provisioned successfully!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to provision staff member.",
    };
  }
}

/**
 * Updates an existing staff member's role.
 * Requires `staff:manage` permission (Owner only).
 */
export async function updateStaffRoleAction(
  targetUserId: string,
  newRole: string
): Promise<StaffActionResult> {
  const session = await requirePermission("staff:manage");

  if (!isValidAdminRole(newRole)) {
    return { success: false, message: "Invalid role selected." };
  }

  // Prevent caller from accidentally demoting themselves if they are the only owner
  if (session.userId === targetUserId && newRole !== "owner") {
    const ownerCount = await prisma.user.count({ where: { role: "owner", banned: false } });
    if (ownerCount <= 1) {
      return { success: false, message: "You cannot demote yourself because you are the sole owner." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Role updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update role.",
    };
  }
}

/**
 * Disables or enables a staff account.
 * When disabled, all active sessions are instantly revoked from the database.
 * Requires `staff:manage` permission (Owner only).
 */
export async function toggleStaffBanAction(
  targetUserId: string,
  banned: boolean,
  banReason?: string
): Promise<StaffActionResult> {
  const session = await requirePermission("staff:manage");

  if (session.userId === targetUserId) {
    return { success: false, message: "You cannot disable your own owner account." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          banned,
          banReason: banned ? banReason || "Access revoked by Store Owner" : null,
          banExpires: null,
        },
      });

      // If disabling the user, IMMEDIATELY revoke all active sessions
      if (banned) {
        await tx.session.deleteMany({
          where: { userId: targetUserId },
        });
      }
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      message: banned
        ? "Staff access revoked and all active sessions terminated."
        : "Staff account re-enabled.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update staff status.",
    };
  }
}

/**
 * Permanently removes a staff member account.
 * Requires `staff:manage` permission (Owner only).
 */
export async function deleteStaffAction(targetUserId: string): Promise<StaffActionResult> {
  const session = await requirePermission("staff:manage");

  if (session.userId === targetUserId) {
    return { success: false, message: "You cannot delete your own owner account." };
  }

  try {
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff account removed." };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to remove staff account.",
    };
  }
}
