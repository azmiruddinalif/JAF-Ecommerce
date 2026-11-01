import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly middleware.ts)
 * Scoped strictly to /admin and /api/admin to protect administrative routes.
 * The storefront is never touched.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth endpoints and login page are always accessible
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Fast session cookie check for admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const hasSessionCookie =
      request.cookies.has("better-auth.session_token") ||
      request.cookies.has("__Secure-better-auth.session_token");

    if (!hasSessionCookie) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
