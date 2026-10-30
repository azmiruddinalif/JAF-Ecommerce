import "dotenv/config";
import { defineConfig } from "prisma/config";

const FALLBACK_CLOUD_DATABASE_URL =
  "postgres://58259a1fa2c20b1ebfd6ca3724964b5296df893b2033712717ab5adf34536a50:sk_2gJcaizLLnZf35GHGd6ma@db.prisma.io:5432/postgres?sslmode=require";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL?.trim() || FALLBACK_CLOUD_DATABASE_URL,
  },
});
