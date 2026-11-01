"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import { signIn } from "@/lib/auth/auth-client";

export function AdminSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both your work email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn.email({
        email: trimmedEmail,
        password,
        rememberMe,
      });

      if (res?.error) {
        setErrorMessage(
          res.error.message ||
            "Invalid email or password. Please verify your credentials or check if your staff account is active."
        );
        setIsLoading(false);
        return;
      }

      // Successful authentication — redirect to admin dashboard
      router.push(returnUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your connection and try again.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[440px]">
      {/* SaaS Card Container */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.06),0_2px_6px_0_rgba(0,0,0,0.03)]">
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
            Enter your authorized store administrator credentials to access your workspace.
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  <span>Verifying Credentials...</span>
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
        <span className="text-slate-400 font-mono text-[11px]">Better Auth v1.7</span>
      </div>
    </div>
  );
}
