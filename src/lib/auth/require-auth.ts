import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function requireAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return session.user;
  }

  const headerStore = await headers();
  const requestPath = headerStore.get("next-url") ?? "/";
  const from = requestPath && requestPath !== "/login" ? `?from=${encodeURIComponent(requestPath)}` : "";
  redirect(`/login${from}`);
}
