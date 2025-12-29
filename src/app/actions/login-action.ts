'use server';

import { redirect } from "next/navigation";
import { initialActionState } from "./action-state";
import { getSupabaseServerActionClient } from "@/lib/supabase/server-action-client";

export async function loginAction(_prevState: typeof initialActionState, formData: FormData) {
  const email = (formData.get("email") ?? "").toString().trim();
  const password = (formData.get("password") ?? "").toString();
  const redirectTo = (formData.get("redirectTo") ?? "/") as string;

  if (!email || !password) {
    return {
      status: "error" as const,
      message: "Debes ingresar correo y contraseña.",
    };
  }

  const supabase = await getSupabaseServerActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error" as const,
      message: error.message ?? "No se pudo iniciar sesión.",
    };
  }

  redirect(redirectTo || "/");
}
