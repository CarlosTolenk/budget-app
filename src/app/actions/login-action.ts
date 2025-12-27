'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initialActionState } from "./action-state";
import { AUTH_COOKIE_NAME, getAuthCredentials, getSessionToken, hasAuthConfig } from "@/lib/auth-config";

export async function loginAction(_prevState: typeof initialActionState, formData: FormData) {
  if (!hasAuthConfig()) {
    return {
      status: "error" as const,
      message: "El login no está configurado. Define ADMIN_USERNAME y ADMIN_PASSWORD.",
    };
  }

  const username = (formData.get("username") ?? "").toString();
  const password = (formData.get("password") ?? "").toString();
  const redirectTo = (formData.get("redirectTo") ?? "/") as string;

  const credentials = getAuthCredentials();
  if (username !== credentials.username || password !== credentials.password) {
    return { status: "error" as const, message: "Credenciales inválidas." };
  }

  const sessionToken = getSessionToken();
  if (!sessionToken) {
    return { status: "error" as const, message: "No se pudo generar la sesión." };
  }

  const secure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  redirect(redirectTo || "/");
}
