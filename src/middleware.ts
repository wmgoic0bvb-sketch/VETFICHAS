import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secureCookie = request.nextUrl.protocol === "https:";

  const token =
    secret != null
      ? await getToken({
          req: request,
          secret,
          secureCookie,
        })
      : null;
  const isLoggedIn = !!token;

  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/carnet") || pathname.startsWith("/api/carnet")) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    const role = (token as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
