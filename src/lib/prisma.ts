import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const FALLBACK_CLOUD_DATABASE_URL =
  "postgres://58259a1fa2c20b1ebfd6ca3724964b5296df893b2033712717ab5adf34536a50:sk_2gJcaizLLnZf35GHGd6ma@db.prisma.io:5432/postgres?sslmode=require";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return FALLBACK_CLOUD_DATABASE_URL;
  if (process.env.NODE_ENV === "production" && (raw.includes("localhost") || raw.includes("127.0.0.1"))) {
    return FALLBACK_CLOUD_DATABASE_URL;
  }
  return raw;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
