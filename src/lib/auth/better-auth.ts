import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

/**
 * Better Auth configuration for JAF Admin Panel.
 *
 * Security Principles:
 * 1. Only admins/staff use authentication; customer accounts are disabled.
 * 2. Public sign-up is strictly disabled at the server level via `disableSignUp: true`.
 * 3. User roles & permissions cannot be self-assigned; `input: false` enforces this.
 * 4. Sessions are backed by PostgreSQL and encrypted HTTP-only cookies.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://jaf-ecommerce.vercel.app"
      : process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://jaf-ecommerce.vercel.app",
    ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "jaf-auth-secret-key-32-chars-minimum-prod-ready",
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Block public signups on the server
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "support",
        input: false, // Client cannot inject or alter role
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      banReason: {
        type: "string",
        required: false,
        input: false,
      },
      banExpires: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session lifetime
    updateAge: 60 * 60 * 24, // update session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

