import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/better-auth";
import {
  type AdminRole,
  type AdminPermission,
  ROLE_PERMISSIONS,
  hasPermission,
  isValidAdminRole,
} from "@/lib/auth/permissions";

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: readonly AdminPermission[];
}

/**
 * Resolves the active admin session using Better Auth.
 * Reads the secure session cookie via Next.js request headers, verifies
 * that the user is not banned, and retrieves their fine-grained permissions.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user || !session.session) {
      return null;
    }

    const { user } = session;

    // Check if user is banned or disabled
    if (user.banned) {
      return null;
    }

    // Role verification
    const rawRole = (user as { role?: string | null }).role;
    const role: AdminRole = isValidAdminRole(rawRole ?? "") ? (rawRole as AdminRole) : "support";

    const permissions = ROLE_PERMISSIONS[role] ?? [];

    return {
      userId: user.id,
      email: user.email.toLowerCase(),
      name: user.name || "Admin",
      role,
      permissions,
    };
  } catch (error) {
    console.error("[auth] Failed to retrieve Better Auth admin session:", error);
    return null;
  }
}

/**
 * Enforces that an authenticated admin session exists.
 * Throws UNAUTHORIZED (401 equivalent) if no valid session is found.
 */
export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Enforces that the current authenticated user possesses a specific permission.
 * Throws FORBIDDEN (403 equivalent) if the user lacks the permission.
 */
export async function requirePermission(permission: AdminPermission): Promise<AdminSessionPayload> {
  const session = await requireAdminSession();
  if (!hasPermission(session.role, permission)) {
    throw new Error(`FORBIDDEN: Missing permission [${permission}] for role [${session.role}]`);
  }
  return session;
}
