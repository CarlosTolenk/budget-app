import { AppUser } from "@/domain/users/user";

export interface UserRepository {
  listAll(): Promise<AppUser[]>;
  findBySupabaseId(supabaseUserId: string): Promise<AppUser | null>;
  findById(id: string): Promise<AppUser | null>;
  findFirstUnlinked(): Promise<AppUser | null>;
  create(data: { supabaseUserId?: string | null; email?: string | null }): Promise<AppUser>;
  update(userId: string, data: { supabaseUserId?: string | null; email?: string | null }): Promise<AppUser>;
}
