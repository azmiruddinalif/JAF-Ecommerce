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
 * Step 1: Pre-authenticate admin credentials, sync with .env if needed, and check client IP.
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

    // 1. Check if input matches .env credentials:
    // If user changed ADMIN_EMAIL or ADMIN_PASSWORD in .env, auto-sync database so it always works directly!
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();

    const isEnvAdminMatch = Boolean(
      envEmail && envPassword && email === envEmail && password === envPassword,
    );

    if (isEnvAdminMatch) {
      // Ensure owner account exists and is synchronized with .env credentials
      const hashedPassword = await hashPassword(password);
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "owner", emailVerified: true, banned: false },
        });

        const credentialAccount = existingUser.accounts.find(
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
              userId: existingUser.id,
              accountId: existingUser.id,
              providerId: "credential",
              password: hashedPassword,
            },
          });
        }
      } else {
        const newUser = await prisma.user.create({
          data: {
            email,
            name: "Store Owner",
            role: "owner",
            emailVerified: true,
            banned: false,
          },
        });
        await prisma.account.create({
          data: {
            userId: newUser.id,
            accountId: newUser.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      }
    }

    // 2. Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

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

    // 3. Verify password hash
    const isValidPassword = await verifyPassword({
      hash: credentialAccount.password,
      password,
    });

    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password." };
    }

    // 4. IP Check:
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

    // 5. New or different IP address detected:
    // If no email service is configured in .env:
    if (!process.env.RESEND_API_KEY) {
      // If credentials match .env owner credentials, allow direct sign-in so owner is never blocked
      if (isEnvAdminMatch) {
        return {
          success: true,
          requiresOtp: false,
          clientIp,
        };
      }
      return {
        success: false,
        error:
          "Email service not configured (RESEND_API_KEY missing in .env). Cannot dispatch security code.",
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
