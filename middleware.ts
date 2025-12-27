import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSessionToken, hasAuthConfig } from "./src/lib/auth-config";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isExcluded(pathname: string) {
  if (pathname.startsWith("/_next") || pathname.startsWith("/public") || pathname.startsWith("/favicon.ico")) {
    return true;
  }
  if (pathname.startsWith("/api/cron")) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  if (!hasAuthConfig()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = getSessionToken();
  if (!sessionToken) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = cookie === sessionToken;

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname.startsWith("/login")) {
    const nextUrl = new URL("/", request.url);
    return NextResponse.redirect(nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
