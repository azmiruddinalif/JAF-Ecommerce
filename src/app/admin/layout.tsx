import { ClerkProvider } from "@clerk/nextjs";

// Clerk is scoped to /admin only — the storefront never depends on it, so a
// missing/misconfigured Clerk key can only ever break the admin area.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
