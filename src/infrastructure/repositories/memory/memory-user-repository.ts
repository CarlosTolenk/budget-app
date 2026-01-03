import { UserRepository } from "@/domain/repositories/user-repository";
import { AppUser, BucketMode } from "@/domain/users/user";
import { memoryUsers } from "./memory-data";

export class MemoryUserRepository implements UserRepository {
  private users = [...memoryUsers];

  async listAll(): Promise<AppUser[]> {
    return [...this.users];
  }
  async findBySupabaseId(supabaseUserId: string): Promise<AppUser | null> {
    return this.users.find((user) => user.supabaseUserId === supabaseUserId) ?? null;
  }

  async findById(id: string): Promise<AppUser | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findFirstUnlinked(): Promise<AppUser | null> {
    return this.users.find((user) => !user.supabaseUserId) ?? null;
  }

  async create(data: { supabaseUserId?: string | null; email?: string | null; bucketMode?: BucketMode }): Promise<AppUser> {
    const user: AppUser = {
      id: `usr-${Math.random().toString(36).slice(2)}`,
      supabaseUserId: data.supabaseUserId ?? null,
      email: data.email ?? null,
      bucketMode: data.bucketMode ?? "PRESET",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users = [...this.users, user];
    return user;
  }

  async update(userId: string, data: { supabaseUserId?: string | null; email?: string | null; bucketMode?: BucketMode }): Promise<AppUser> {
    const index = this.users.findIndex((user) => user.id === userId);
    if (index === -1) {
      throw new Error("User not found");
    }

    const updated: AppUser = {
      ...this.users[index],
      supabaseUserId: data.supabaseUserId ?? this.users[index].supabaseUserId,
      email: data.email ?? this.users[index].email,
      bucketMode: data.bucketMode ?? this.users[index].bucketMode,
      updatedAt: new Date(),
    };
    this.users[index] = updated;
    return updated;
  }
}
