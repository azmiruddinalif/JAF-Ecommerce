import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Applying auth tables to PostgreSQL database...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      "image" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "role" TEXT NOT NULL DEFAULT 'support',
      "banned" BOOLEAN DEFAULT false,
      "banReason" TEXT,
      "banExpires" TIMESTAMP(3),
      CONSTRAINT "user_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");`,

    `CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "token" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session"("token");`,

    `CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMP(3),
      "refreshTokenExpiresAt" TIMESTAMP(3),
      "scope" TEXT,
      "password" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "account_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT NOT NULL,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE TABLE IF NOT EXISTS "staff_invitation" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'support',
      "token" TEXT NOT NULL,
      "invitedById" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "staff_invitation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "staff_invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "staff_invitation_email_key" ON "staff_invitation"("email");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "staff_invitation_token_key" ON "staff_invitation"("token");`
  ];

  for (const q of queries) {
    await prisma.$executeRawUnsafe(q);
  }

  console.log("All auth tables successfully created in database!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

