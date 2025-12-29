import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createOAuthClient, gmailScopes } from "@/auth/googleOAuth";
import { requireAuth } from "@/lib/auth/require-auth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const { appUser } = await requireAuth();
  const redirectTo = request.nextUrl.searchParams.get("redirectTo") ?? "/transactions";
  const stateToken = randomBytes(16).toString("hex");
  const oAuth2Client = createOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: gmailScopes,
    state: stateToken,
  });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, JSON.stringify({ token: stateToken, userId: appUser.id, redirectTo }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
