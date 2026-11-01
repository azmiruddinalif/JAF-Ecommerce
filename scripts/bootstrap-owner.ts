import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "better-auth/crypto";

function assertStrongPassword(password: string) {
  const checks = [
    { ok: password.length >= 10, message: "at least 10 characters" },
    { ok: /[a-z]/.test(password), message: "a lowercase letter" },
    { ok: /[A-Z]/.test(password), message: "an uppercase letter" },
    { ok: /[0-9]/.test(password), message: "a number" },
  ];
  const failed = checks.filter((c) => !c.ok).map((c) => c.message);
  if (failed.length > 0) {
    throw new Error(`ADMIN_PASSWORD is too weak — it needs ${failed.join(", ")}.`);
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email) throw new Error("ADMIN_EMAIL is not set in .env");
  if (!password) throw new Error("ADMIN_PASSWORD is not set in .env");

  assertStrongPassword(password);

  console.log(`[bootstrap] Checking owner account for: ${email}`);

  // Check if an owner already exists
  const existingOwner = await prisma.user.findFirst({
    where: { role: "owner" },
  });

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existingOwner && existingOwner.email !== email) {
    console.error(
      `[bootstrap] SECURITY ERROR: An owner account already exists (${existingOwner.email}).`
    );
    console.error(
      `[bootstrap] For security, the bootstrap command cannot overwrite or create secondary owners after initial setup.`
    );
    console.error(
      `[bootstrap] Please sign in as ${existingOwner.email} at /admin/login and use the Admin Staff panel.`
    );
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);

  if (existingByEmail) {
    // Update existing user to owner and refresh password
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingByEmail.id },
        data: {
          role: "owner",
          emailVerified: true,
          banned: false,
          name: existingByEmail.name || "Store Owner",
        },
      });

      const credentialAccount = existingByEmail.accounts.find(
        (a) => a.providerId === "credential"
      );

      if (credentialAccount) {
        await tx.account.update({
          where: { id: credentialAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        await tx.account.create({
          data: {
            userId: existingByEmail.id,
            accountId: existingByEmail.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      }

      // Revoke any old active sessions on password reset
      await tx.session.deleteMany({
        where: { userId: existingByEmail.id },
      });
    });

    console.log(`[bootstrap] Successfully updated owner credentials for: ${email}`);
  } else {
    // Create first owner
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name: "Store Owner",
          role: "owner",
          emailVerified: true,
          banned: false,
        },
      });

      await tx.account.create({
        data: {
          userId: newUser.id,
          accountId: newUser.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    });

    console.log(`[bootstrap] Successfully created initial store owner: ${email}`);
  }

  console.log(`[bootstrap] You can now sign in at /admin/login with your credentials.`);
}

main()
  .catch((err) => {
    console.error("[bootstrap] Error:", err.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

