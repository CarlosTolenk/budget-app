import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_COOKIE_NAME, getSessionToken, hasAuthConfig } from "@/lib/auth-config";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const redirectToParam = typeof resolvedParams.from === "string" ? resolvedParams.from : "/";
  const sessionToken = getSessionToken();
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (sessionToken && currentToken === sessionToken) {
    redirect(redirectToParam && redirectToParam !== "/login" ? redirectToParam : "/");
  }

  const authConfigured = hasAuthConfig();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Acceso privado</p>
        <h1 className="text-3xl font-semibold text-white">Inicia sesión</h1>
        <p className="text-sm text-slate-400">Necesitas las credenciales definidas en las variables de entorno.</p>
      </div>
      {!authConfigured && (
        <p className="rounded-lg bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
          Debes configurar ADMIN_USERNAME y ADMIN_PASSWORD para habilitar el login.
        </p>
      )}
      <LoginForm redirectTo={redirectToParam} />
    </div>
  );
}
