import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { serverContainer } from "@/infrastructure/config/server-container";
import { AppUser } from "@/domain/users/user";

export interface AuthenticatedUser {
  supabaseUser: {
    id: string;
    email?: string | null;
  };
  appUser: AppUser;
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const headerStore = await headers();
    const requestPath = headerStore.get("next-url") ?? "/";
    const from = requestPath && requestPath !== "/login" ? `?from=${encodeURIComponent(requestPath)}` : "";
    redirect(`/login${from}`);
  }

  const supabaseUser = {
    id: session.user.id,
    email: session.user.email,
  };

  const { userRepository } = serverContainer();
  let appUser = await userRepository.findBySupabaseId(supabaseUser.id);

  if (!appUser) {
    const legacy = await userRepository.findFirstUnlinked();
    if (legacy) {
      appUser = await userRepository.update(legacy.id, {
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email ?? legacy.email,
      });
    } else {
      appUser = await userRepository.create({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email ?? null,
      });
    }
  } else if (supabaseUser.email && appUser.email !== supabaseUser.email) {
    appUser = await userRepository.update(appUser.id, { email: supabaseUser.email });
  }

  return { supabaseUser, appUser };
}
