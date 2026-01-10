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

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const supabaseUser = {
    id: session.user.id,
    email: session.user.email,
  };

  const appUser = await resolveAppUser(supabaseUser);
  return { supabaseUser, appUser };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const authenticatedUser = await getAuthenticatedUser();
  if (authenticatedUser) {
    return authenticatedUser;
  }

  const headerStore = await headers();
  const requestPath = headerStore.get("next-url") ?? "/";
  const from = requestPath && requestPath !== "/login" ? `?from=${encodeURIComponent(requestPath)}` : "";
  redirect(`/login${from}`);
}

async function resolveAppUser(supabaseUser: { id: string; email?: string | null }): Promise<AppUser> {
  const { userRepository, userBucketRepository } = serverContainer();
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

  await userBucketRepository.ensurePresetBuckets(appUser.id);
  if (appUser.bucketMode === "PRESET") {
    await userBucketRepository.activatePresetBuckets(appUser.id);
  }

  return appUser;
}
