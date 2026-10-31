import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
}

function getAllowedAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL || "alifazmiruddin@gmail.com";
  return email.toLowerCase();
}

/**
 * Resolves the current admin session, enforcing that the Clerk-authenticated
 * user's email matches ADMIN_EMAIL. This dashboard is single-admin: Clerk
 * verifies identity, this check verifies it's the one allowed identity —
 * defense in depth against Clerk sign-up ever being left open by mistake.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email || email.toLowerCase() !== getAllowedAdminEmail()) {
    return null;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin";

  return { userId, email, name };
}

export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
