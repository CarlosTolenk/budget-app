import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient } from "@/auth/googleOAuth";
import { serverContainer } from "@/infrastructure/config/server-container";

const STATE_COOKIE = "google_oauth_state";

function buildRedirect(request: NextRequest, path: string, params: Record<string, string>): NextResponse {
  const destination = new URL(path, request.nextUrl.origin);
  Object.entries(params).forEach(([key, value]) => destination.searchParams.set(key, value));
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookieRaw = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !stateCookieRaw) {
    return buildRedirect(request, "/transactions", { gmail: "error", reason: "missing_state" });
  }

  try {
    const parsedState = JSON.parse(stateCookieRaw) as { token: string; userId: string; redirectTo?: string };
    if (parsedState.token !== state || !parsedState.userId) {
      return buildRedirect(request, parsedState.redirectTo ?? "/transactions", { gmail: "error", reason: "invalid_state" });
    }

    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    if (!tokens.refresh_token) {
      return buildRedirect(request, parsedState.redirectTo ?? "/transactions", {
        gmail: "error",
        reason: "missing_refresh_token",
      });
    }

    const { gmailCredentialRepository } = serverContainer();
    await gmailCredentialRepository.upsert({ userId: parsedState.userId, refreshToken: tokens.refresh_token });

    const response = buildRedirect(request, parsedState.redirectTo ?? "/transactions", { gmail: "connected" });
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("[oauth] google callback failed", error);
    return buildRedirect(request, "/transactions", { gmail: "error", reason: "unexpected" });
  }
}
