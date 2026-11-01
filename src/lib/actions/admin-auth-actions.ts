/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/better-auth";
import { hashPassword, verifyPassword } from "better-auth/crypto";

/**
 * Extracts client IP address from standard proxy headers safely
 */
async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    const cfIp = headerList.get("cf-connecting-ip");

    const rawIp =
      cfIp ||
      (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) ||
      "127.0.0.1";
    return rawIp.trim();
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Mask an email address for privacy in UI notices (e.g. al***@gmail.com)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * Send 6-digit security code via Resend if configured
 */
async function sendSecurityCodeEmail(
  email: string,
  code: string,
  clientIp: string,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n======================================================`);
    console.log(`[JAF ADMIN SECURITY CODE] IP: ${clientIp}`);
    console.log(`[JAF ADMIN SECURITY CODE] Email: ${email}`);
    console.log(`[JAF ADMIN SECURITY CODE] 6-Digit OTP: ${code}`);
    console.log(`======================================================\n`);
    return { sent: false, reason: "RESEND_API_KEY not configured in .env" };
  }

  try {
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM_EMAIL || "JAF Security <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: email,
      subject: `Your JAF Admin Security Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #059669; background-color: #ecfdf5; padding: 4px 10px; border-radius: 9999px;">
              JAF Store Operations
            </span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">
            New IP Address Sign-In
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin: 0 0 24px;">
            A sign-in request was initiated for your store administration account from a new IP address:
            <strong style="color: #0f172a;">${clientIp}</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
              Your 6-Digit Verification Code
            </span>
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #059669;">
              ${code}
            </span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
            This security code will expire in 10 minutes. If you did not attempt this sign-in, please change your credentials immediately.
          </p>
        </div>
      `,
    });

    return { sent: true };
  } catch (error: any) {
    console.error(
      "[JAF Security] Failed to send security email:",
      error.message || error,
    );
    return { sent: false, reason: error.message };
  }
}

/**
 * Send 6-digit password reset code via Resend if configured
 */
async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n======================================================`);
    console.log(`[JAF ADMIN PASSWORD RESET CODE]`);
    console.log(`Target Email: ${email}`);
    console.log(`6-Digit Verification Code: ${code}`);
    console.log(`(Configure RESEND_API_KEY in .env to dispatch real emails)`);
    console.log(`======================================================\n`);
    return { sent: false, reason: "RESEND_API_KEY not configured in .env" };
  }

  try {
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM_EMAIL || "JAF Security <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: email,
      subject: `Your JAF Admin Password Reset Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #059669; background-color: #ecfdf5; padding: 4px 10px; border-radius: 9999px;">
              JAF Store Operations
            </span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">
            Password Reset Request
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin: 0 0 24px;">
            A password reset was requested for your store administrator account (<strong style="color: #0f172a;">${email}</strong>).
          </p>

          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
              Your 6-Digit Password Reset Code
            </span>
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #059669;">
              ${code}
            </span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
            This security code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return { sent: true };
  } catch (error: any) {
    console.error(
      "[JAF Security] Failed to send password reset email:",
      error.message || error,
    );
    return { sent: false, reason: error.message };
  }
}

/**
 * Step 1: Pre-authenticate admin credentials against PostgreSQL database, and check client IP.
 * Password strictly lives in the database and does not depend on or get overwritten by .env.
 */
export async function preAuthenticateAdminAction(params: {
  email: string;
  password: string;
}) {
  try {
    const email = params.email.trim().toLowerCase();
    const password = params.password.trim();

    if (!email || !password) {
      return {
        success: false,
        error: "Please enter both your work email and password.",
      };
    }

    const clientIp = await getClientIp();

    // 1. Fetch user from DB
    let user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    // If no user exists yet in DB, check if this is the initial owner bootstrap matching .env
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!user && envEmail && envPassword && email === envEmail) {
      const hashedPassword = await hashPassword(envPassword);
      user = await prisma.user.create({
        data: {
          email: envEmail,
          name: "Store Owner",
          role: "owner",
          emailVerified: true,
          banned: false,
        },
        include: { accounts: true },
      });
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
      // Re-fetch user with account
      user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true },
      });
    }

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    if (user.banned) {
      return {
        success: false,
        error:
          "This staff account has been deactivated. Please contact the store owner.",
      };
    }

    const credentialAccount = user.accounts.find(
      (a) => a.providerId === "credential",
    );
    if (!credentialAccount || !credentialAccount.password) {
      return { success: false, error: "Invalid email or password." };
    }

    // 2. Strictly verify password against hashed password in PostgreSQL:
    // (Never overwritten or forced by .env so passwords have NO dependency on .env!)
    const isValidPassword = await verifyPassword({
      hash: credentialAccount.password,
      password,
    });

    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password." };
    }

    // 3. IP Check:
    // Has this user ever verified this IP address?
    const ipIdentifier = `trusted_ip:${user.id}:${clientIp}`;
    const trustedIp = await prisma.verification.findFirst({
      where: {
        identifier: ipIdentifier,
        expiresAt: { gt: new Date() },
      },
    });

    if (trustedIp) {
      // Known, trusted IP address — allow immediate direct sign-in!
      return {
        success: true,
        requiresOtp: false,
        clientIp,
      };
    }

    // 4. New or different IP address detected:
    // If no email service is configured in .env:
    if (!process.env.RESEND_API_KEY) {
      // Automatically trust this IP so admin/developer is never locked out in dev environments
      await prisma.verification.create({
        data: {
          identifier: ipIdentifier,
          value: clientIp,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
      return {
        success: true,
        requiresOtp: false,
        clientIp,
      };
    }

    // Generate a cryptographically secure 6-digit OTP code
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpIdentifier = `admin_otp:${user.id}`;

    // Store in verification table for 10 minutes
    await prisma.verification.deleteMany({
      where: { identifier: otpIdentifier },
    });
    await prisma.verification.create({
      data: {
        identifier: otpIdentifier,
        value: `${otp}:${clientIp}`,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send email to inbox via Resend
    const emailResult = await sendSecurityCodeEmail(user.email, otp, clientIp);

    if (!emailResult.sent) {
      return {
        success: false,
        error: `Failed to deliver verification email: ${emailResult.reason || "Check email service."}`,
      };
    }

    return {
      success: true,
      requiresOtp: true,
      clientIp,
      maskedEmail: maskEmail(user.email),
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Failed to authenticate administrator.";
    console.error("[preAuthenticateAdminAction Error]:", err);
    return { success: false, error: errorMsg };
  }
}



/**
 * Step 2: Verify the 6-digit OTP code and mark the new IP address as trusted.
 */
export async function verifyAdminOtpAction(params: {
  email: string;
  code: string;
}) {
  try {
    const email = params.email.trim().toLowerCase();
    const code = params.code.trim();

    if (!email || !code || code.length !== 6) {
      return {
        success: false,
        error: "Please enter the valid 6-digit verification code.",
      };
    }

    const clientIp = await getClientIp();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid session or user account not found.",
      };
    }

    const otpIdentifier = `admin_otp:${user.id}`;
    const verificationRecord = await prisma.verification.findFirst({
      where: {
        identifier: otpIdentifier,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationRecord) {
      return {
        success: false,
        error:
          "Verification code has expired or is invalid. Please sign in again to receive a new code.",
      };
    }

    const [savedOtp, savedIp] = verificationRecord.value.split(":");

    if (savedOtp !== code) {
      return {
        success: false,
        error:
          "Incorrect 6-digit verification code. Please check your email and try again.",
      };
    }

    // Clean up the single-use OTP
    await prisma.verification.deleteMany({
      where: { identifier: otpIdentifier },
    });

    // Save this IP as trusted for 90 days
    const ipIdentifier = `trusted_ip:${user.id}:${clientIp || savedIp}`;
    await prisma.verification.deleteMany({
      where: { identifier: ipIdentifier },
    });
    await prisma.verification.create({
      data: {
        identifier: ipIdentifier,
        value: clientIp || savedIp,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    return {
      success: true,
      message: "IP address successfully verified.",
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to verify security code.";
    console.error("[verifyAdminOtpAction Error]:", err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Step 3: Server-side explicit admin logout to revoke session from PostgreSQL and purge cookies.
 */
export async function adminSignOutAction() {
  try {
    const headerList = await headers();
    await auth.api.signOut({
      headers: headerList,
    });
  } catch (err) {
    console.error("[adminSignOutAction Error]:", err);
  }

  // Explicitly purge all session cookies on the response so Next.js never serves cached session state
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes("better-auth")) {
        cookieStore.delete(cookie.name);
      }
    }
  } catch (err) {
    console.error("[adminSignOutAction cookie purge error]:", err);
  }

  return { success: true };
}

/**
 * Step 4: Request 6-digit password reset OTP sent to the admin email
 */
export async function requestAdminPasswordResetAction(params: {
  email?: string;
}) {
  try {
    const rawEmail = params.email?.trim().toLowerCase();
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const targetEmail = rawEmail || envEmail;

    if (!targetEmail) {
      return {
        success: false,
        error: "Please enter your registered administrator email address.",
      };
    }

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    // Auto-bootstrap owner if target matches ADMIN_EMAIL and user doesn't exist yet
    if (!user && envEmail && targetEmail === envEmail) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: "Store Owner",
          role: "owner",
          emailVerified: true,
          banned: false,
        },
      });
    }

    if (!user) {
      return {
        success: false,
        error: "No administrator account found with that email address.",
      };
    }

    if (user.banned) {
      return {
        success: false,
        error: "This staff account has been deactivated. Please contact the store owner.",
      };
    }

    // Generate 6-digit secure code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetIdentifier = `admin_reset_otp:${user.id}`;

    // Store in verification table for 10 minutes
    await prisma.verification.deleteMany({
      where: { identifier: resetIdentifier },
    });
    await prisma.verification.create({
      data: {
        identifier: resetIdentifier,
        value: resetCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send email via Resend
    const emailResult = await sendPasswordResetEmail(user.email, resetCode);

    return {
      success: true,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      emailSent: emailResult.sent,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to initiate password reset.";
    console.error("[requestAdminPasswordResetAction Error]:", err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Step 5: Verify the 6-digit reset code and update password in PostgreSQL
 */
export async function resetAdminPasswordAction(params: {
  email: string;
  code: string;
  newPassword: string;
}) {
  try {
    const email = params.email.trim().toLowerCase();
    const code = params.code.trim();
    const newPassword = params.newPassword.trim();

    if (!email || !code || code.length !== 6) {
      return {
        success: false,
        error: "Please enter the valid 6-digit verification code.",
      };
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters long.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      return { success: false, error: "Invalid password reset request." };
    }

    const resetIdentifier = `admin_reset_otp:${user.id}`;
    const storedVerification = await prisma.verification.findFirst({
      where: {
        identifier: resetIdentifier,
        value: code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedVerification) {
      return {
        success: false,
        error: "Invalid or expired verification code. Please request a new one.",
      };
    }

    // Hash the new password using Better Auth's standard hasher
    const hashedPassword = await hashPassword(newPassword);

    // Update credential account in PostgreSQL
    const credentialAccount = user.accounts.find(
      (a) => a.providerId === "credential",
    );

    if (credentialAccount) {
      await prisma.account.update({
        where: { id: credentialAccount.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    }

    // Delete used verification record
    await prisma.verification.deleteMany({
      where: { identifier: resetIdentifier },
    });

    // Whitelist the client's current IP address so they won't be challenged on next login
    const clientIp = await getClientIp();
    const ipIdentifier = `trusted_ip:${user.id}:${clientIp}`;
    await prisma.verification.deleteMany({
      where: { identifier: ipIdentifier },
    });
    await prisma.verification.create({
      data: {
        identifier: ipIdentifier,
        value: clientIp,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Revoke any existing active sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to reset password.";
    console.error("[resetAdminPasswordAction Error]:", err);
    return { success: false, error: errorMsg };
  }
}
