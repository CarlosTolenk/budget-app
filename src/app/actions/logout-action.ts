'use server';

import { redirect } from "next/navigation";
import { getSupabaseServerActionClient } from "@/lib/supabase/server-action-client";

export async function logoutAction() {
  const supabase = await getSupabaseServerActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
