import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const redirectToParam = typeof resolvedParams.from === "string" ? resolvedParams.from : "/";
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect(redirectToParam && redirectToParam !== "/login" ? redirectToParam : "/");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Acceso privado</p>
        <h1 className="text-3xl font-semibold text-white">Inicia sesión</h1>
        <p className="text-sm text-slate-400">Autentícate con el usuario creado en Supabase Auth.</p>
      </div>
      <LoginForm redirectTo={redirectToParam} />
    </div>
  );
}
