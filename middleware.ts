import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isExcluded(pathname)) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name) {
        response.cookies.delete(name);
      },
    },
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = Boolean(session);

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
