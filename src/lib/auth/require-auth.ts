import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, getSessionToken, hasAuthConfig } from "../auth-config";

export async function requireAuth() {
  if (!hasAuthConfig()) {
    return;
  }

  const sessionToken = getSessionToken();
  if (!sessionToken) {
    return;
  }

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (currentToken === sessionToken) {
    return;
  }

  const headerStore = await headers();
  const requestPath = headerStore.get("next-url") ?? "/";
  const from = requestPath && requestPath !== "/login" ? `?from=${encodeURIComponent(requestPath)}` : "";
  redirect(`/login${from}`);
}
