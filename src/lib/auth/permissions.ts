/**
 * Centralized Role-Based Access Control (RBAC) & Fine-Grained Permissions
 * for JAF Admin Panel.
 *
 * Rules:
 * 1. Default to denying access unless the user's role explicitly has the permission.
 * 2. Only 'owner' has 'staff:manage' (cannot be granted by or to non-owners).
 * 3. Storefront customers NEVER have roles or access to these permissions.
 */

export const ADMIN_ROLES = ["owner", "order_manager", "product_manager", "support"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "orders:read",
  "orders:update",
  "products:read",
  "products:manage",
  "inventory:update",
  "categories:manage",
  "blog:manage",
  "settings:manage",
  "staff:manage",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    "orders:read",
    "orders:update",
    "products:read",
    "products:manage",
    "inventory:update",
    "categories:manage",
    "blog:manage",
    "settings:manage",
    "staff:manage",
  ],
  order_manager: [
    "orders:read",
    "orders:update",
    "products:read",
  ],
  product_manager: [
    "products:read",
    "products:manage",
    "inventory:update",
    "categories:manage",
  ],
  support: [
    "orders:read",
    "products:read",
  ],
};

export const ROLE_LABELS: Record<AdminRole, { title: string; description: string; badgeColor: string }> = {
  owner: {
    title: "Store Owner",
    description: "Full access to all store data, revenue, system settings, and staff management.",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  order_manager: {
    title: "Order Manager",
    description: "Manage orders, update fulfilment status, view customer shipping details and invoices.",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  product_manager: {
    title: "Product Manager",
    description: "Create and edit products, upload photos, manage stock variants and categories.",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  support: {
    title: "Support Specialist",
    description: "Read-only access to customer orders and catalog details to assist shoppers.",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

/**
 * Checks whether a given role holds a specific permission.
 */
export function hasPermission(role: string | null | undefined, permission: AdminPermission): boolean {
  if (!role) return false;
  const roleKey = role.toLowerCase() as AdminRole;
  const perms = ROLE_PERMISSIONS[roleKey];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Validates if a role string is a recognized admin role.
 */
export function isValidAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

