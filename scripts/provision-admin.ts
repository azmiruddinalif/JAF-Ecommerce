import "dotenv/config";
import { clerkClient } from "@clerk/nextjs/server";

function assertStrongPassword(password: string) {
  const checks = [
    { ok: password.length >= 12, message: "at least 12 characters" },
    { ok: /[a-z]/.test(password), message: "a lowercase letter" },
    { ok: /[A-Z]/.test(password), message: "an uppercase letter" },
    { ok: /[0-9]/.test(password), message: "a number" },
    { ok: /[^a-zA-Z0-9]/.test(password), message: "a symbol" },
  ];
  const failed = checks.filter((c) => !c.ok).map((c) => c.message);
  if (failed.length > 0) {
    throw new Error(`ADMIN_PASSWORD is too weak — it needs ${failed.join(", ")}.`);
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email) throw new Error("ADMIN_EMAIL is not set in .env");
  if (!password) throw new Error("ADMIN_PASSWORD is not set in .env");
  if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is not set in .env");

  assertStrongPassword(password);

  const client = await clerkClient();
  const existing = await client.users.getUserList({ emailAddress: [email] });

  if (existing.data.length > 0) {
    const user = existing.data[0];
    await client.users.updateUser(user.id, {
      password,
      signOutOfOtherSessions: true,
    });
    console.log(`Updated existing admin user: ${email}`);
  } else {
    await client.users.createUser({
      emailAddress: [email],
      password,
      firstName: "JAF",
      lastName: "Admin",
    });
    console.log(`Created admin user: ${email}`);
  }

  console.log("Sign in at /admin/login with ADMIN_EMAIL / ADMIN_PASSWORD from .env.");
}

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  })
  .then(() => process.exit(0));
