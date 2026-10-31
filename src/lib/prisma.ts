import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const LOCAL_DEV_DATABASE_URL =
  "postgresql://jaf:jafpassword@localhost:55432/jaf_jersey?schema=public";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

// This was a real credential committed in a6c4f50 and must be treated as
// compromised; it is matched here only to reject it, never to reconnect with it.
const LEAKED_CREDENTIAL_MARKER =
  "58259a1fa2c20b1ebfd6ca3724964b5296df893b2033712717ab5adf34536a50";

function resolveDatabaseUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    const localUrl = process.env.LOCAL_DATABASE_URL?.trim();
    if (localUrl) return localUrl;
  }

  const raw = process.env.DATABASE_URL?.trim();
  const isUsable = raw && !raw.includes(LEAKED_CREDENTIAL_MARKER);

  if (process.env.NODE_ENV === "production" && !isUsable) {
    // Falling back to a localhost URL in production is silent data loss: that
    // URL is unreachable from Vercel, so every query fails and pages quietly
    // render as empty instead of surfacing a configuration error. Log loudly
    // (rather than throw, which would 500 every page) so this is unmissable
    // in the Vercel runtime logs until DATABASE_URL is fixed in the project
    // settings.
    console.error(
      raw
        ? "[prisma] DATABASE_URL still contains the leaked db.prisma.io credential from commit a6c4f50 and is being rejected. Rotate the credential and set a fresh DATABASE_URL in the Vercel project settings. Falling back to an unreachable localhost database until this is fixed."
        : "[prisma] DATABASE_URL is not set in this environment. Set it in the Vercel project settings. Falling back to an unreachable localhost database until this is fixed."
    );
  }

  return isUsable ? raw : LOCAL_DEV_DATABASE_URL;
}

const activeUrl = resolveDatabaseUrl();

function createPrismaClient(connectionString: string) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== activeUrl) {
  globalForPrisma.prisma = createPrismaClient(activeUrl);
  globalForPrisma.prismaUrl = activeUrl;
}

export const prisma = globalForPrisma.prisma;
