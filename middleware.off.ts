import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const adminId = req.cookies.get("adminId")?.value;
  const customerId = req.cookies.get("customerId")?.value;

  // Publieke routes
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  // Admin routes -> alleen admin
  if (pathname.startsWith("/dashboard")) {
    if (!adminId) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Klant routes -> alleen klant
  if (pathname.startsWith("/orders") || pathname.startsWith("/my-orders")) {
    if (!customerId) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Als je niets matched, laat door
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
