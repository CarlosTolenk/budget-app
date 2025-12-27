const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export const AUTH_COOKIE_NAME = "presupuesto_session";

export function hasAuthConfig(): boolean {
  return Boolean(ADMIN_USERNAME && ADMIN_PASSWORD);
}

export function getAuthCredentials() {
  return {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  };
}

export function getSessionToken(): string | null {
  if (!hasAuthConfig()) {
    return null;
  }

  return `${ADMIN_USERNAME}:${ADMIN_PASSWORD}`;
}
