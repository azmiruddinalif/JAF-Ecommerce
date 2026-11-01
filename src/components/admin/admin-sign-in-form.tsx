"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Store,
} from "lucide-react";
import { signIn } from "@/lib/auth/auth-client";
import {
  preAuthenticateAdminAction,
  verifyAdminOtpAction,
} from "@/lib/actions/admin-auth-actions";

export function AdminSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [detectedIp, setDetectedIp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [previewCode, setPreviewCode] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both your work email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Pre-authenticate, sync with .env if needed, and check IP trust
      const preAuth = await preAuthenticateAdminAction({
        email: trimmedEmail,
        password,
      });

      if (!preAuth.success) {
        setErrorMessage(preAuth.error || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      if (preAuth.requiresOtp) {
        // Different / new IP detected — prompt for 6-digit code
        setDetectedIp(preAuth.clientIp || "New Location");
        setMaskedEmail(preAuth.maskedEmail || trimmedEmail);
        setPreviewCode(preAuth.previewCode);
        setStep("otp");
        setIsLoading(false);
        return;
      }

      // IP is already trusted: sign in directly via Better Auth
      const res = await signIn.email({
        email: trimmedEmail,
        password,
        rememberMe,
      });

      if (res?.error) {
        setErrorMessage(res.error.message || "Failed to establish admin session.");
        setIsLoading(false);
        return;
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your connection.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 2: Verify OTP code and whitelist this IP address
      const verifyRes = await verifyAdminOtpAction({
        email: email.trim().toLowerCase(),
        code: cleanCode,
      });

      if (!verifyRes.success) {
        setErrorMessage(verifyRes.error || "Invalid verification code.");
        setIsLoading(false);
        return;
      }

      // Establish Better Auth authenticated session
      const authRes = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      if (authRes?.error) {
        setErrorMessage(authRes.error.message || "Failed to finalize session.");
        setIsLoading(false);
        return;
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[440px]">
      {/* SaaS Card Container */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.06),0_2px_6px_0_rgba(0,0,0,0.03)] transition-all">
        {step === "credentials" ? (
          <>
            {/* Card Header */}
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Staff Authentication Portal</span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Sign In
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Enter your authorized administrator credentials to access your store workspace.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 animate-in fade-in-50 duration-200"
              >
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="admin-email-input"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Work Email Address
                </label>
                <div className="relative group">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Mail size={17} />
                  </span>
                  <input
                    id="admin-email-input"
                    name="email"
                    type="email"
                    required
                    autoComplete="username email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@jafjersey.com"
                    disabled={isLoading}
                    className="h-11 sm:h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="admin-password-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Encrypted
                  </span>
                </div>
                <div className="relative group">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Lock size={17} />
                  </span>
                  <input
                    id="admin-password-input"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className="h-11 sm:h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-11 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600 hover:text-slate-900">
                    Keep me signed in for 7 days
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Verifying Credentials &amp; IP...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Step 2: 6-Digit OTP Verification */
          <>
            {/* OTP Card Header */}
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900 shadow-2xs">
                <ShieldAlert size={12} className="text-amber-600" />
                <span>New IP Address Verification</span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Security Code
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                A sign-in request from IP <strong className="font-mono text-slate-700">{detectedIp}</strong>{" "}
                requires verification. Enter the 6-digit code sent to{" "}
                <strong className="text-slate-800">{maskedEmail}</strong>.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 animate-in fade-in-50 duration-200"
              >
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Dev Fallback Notice if Resend API Key is not set */}
            {previewCode && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 font-semibold">
                  <KeyRound size={15} className="text-emerald-700 shrink-0" />
                  <span>One-Time Passcode Generated:</span>
                </div>
                <p className="mt-1.5 text-emerald-800">
                  (Resend email key not configured in .env). Use code:{" "}
                  <strong className="font-mono text-sm tracking-widest text-emerald-950 font-bold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300/60">
                    {previewCode}
                  </strong>
                </p>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-otp-input"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="admin-otp-input"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-900 placeholder:text-slate-300 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Verifying Code &amp; Whitelisting IP...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Enter Dashboard</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtpCode("");
                    setErrorMessage(null);
                  }}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Change Email or Password</span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* Security / Role Info Footer */}
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
          <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Multi-role access: Owner • Manager • Support</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
            <span>Storefront customers checkout as guests without accounts</span>
          </div>
        </div>
      </div>

      {/* Helpful links below card */}
      <div className="mt-6 flex items-center justify-between px-2 text-xs text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium transition-colors"
        >
          <Store size={13} />
          <span>Back to JAF Storefront</span>
        </Link>
        <span className="text-slate-400 font-mono text-[11px]">IP-Gated Protection</span>
      </div>
    </div>
  );
}
