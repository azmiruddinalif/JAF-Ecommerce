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

function getOrInitPrisma(): PrismaClient {
  // In Next.js dev server, globalThis.prisma persists across hot module reloads.
  // If the Prisma schema was updated (e.g. adding User/Session models), an old cached
  // instance will lack `user` or `session`. Force instantiation if missing models.
  if (
    !globalForPrisma.prisma ||
    globalForPrisma.prismaUrl !== activeUrl ||
    !("user" in (globalForPrisma.prisma as unknown as Record<string, unknown>))
  ) {
    globalForPrisma.prisma = createPrismaClient(activeUrl);
    globalForPrisma.prismaUrl = activeUrl;
  }
  return globalForPrisma.prisma;
}

// Export a proxy so any access to prisma properties (e.g. prisma.user, prisma.product, prisma.$queryRaw)
// is always guaranteed to resolve to an active, up-to-date client with all models defined.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getOrInitPrisma();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
