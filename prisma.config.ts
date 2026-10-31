import "dotenv/config";
import { defineConfig } from "prisma/config";

const LOCAL_DEV_DATABASE_URL =
  "postgresql://jaf:jafpassword@localhost:55432/jaf_jersey?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL?.trim() || LOCAL_DEV_DATABASE_URL,
  },
});
