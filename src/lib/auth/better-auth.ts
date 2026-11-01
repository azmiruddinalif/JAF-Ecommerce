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
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://jaf-ecommerce.vercel.app"
      : "http://localhost:3000"),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.CLERK_SECRET_KEY ||
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
