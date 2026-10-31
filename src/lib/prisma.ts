import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const LOCAL_DEV_DATABASE_URL =
  "postgresql://jaf:jafpassword@localhost:55432/jaf_jersey?schema=public";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

function resolveDatabaseUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    const localUrl = process.env.LOCAL_DATABASE_URL?.trim();
    if (localUrl) return localUrl;
  }

  const raw = process.env.DATABASE_URL?.trim();
  if (raw && !raw.includes("58259a1fa2c20b1ebfd6ca3724964b5296df893b2033712717ab5adf34536a50")) {
    return raw;
  }

  return LOCAL_DEV_DATABASE_URL;
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
