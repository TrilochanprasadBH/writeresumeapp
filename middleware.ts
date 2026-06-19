import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept API routes
  if (pathname.startsWith("/api/")) {
    // CORS — same origin only in production
    const origin = req.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (
      origin &&
      appUrl &&
      process.env.NODE_ENV === "production" &&
      origin !== appUrl
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // req.ip is set by Vercel's edge and cannot be forged by clients.
    // x-forwarded-for CAN be spoofed, so we only use it as a local-dev fallback.
    // When multiple proxies are chained, the real client IP is the LAST entry
    // (each proxy appends, so the first entry is the one the client supplied).
    const ip =
      req.ip ??
      req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
      "127.0.0.1";

    // Forward the verified IP on the request so route handlers can read it.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-real-ip", ip);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
