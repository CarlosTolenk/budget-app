import { prisma } from "@/infrastructure/db/prisma-client";
import { UserRepository } from "@/domain/repositories/user-repository";
import { AppUser } from "@/domain/users/user";

export class PrismaUserRepository implements UserRepository {
  async listAll(): Promise<AppUser[]> {
    const records = await prisma.user.findMany();
    return records.map((record) => this.map(record));
  }
  async findBySupabaseId(supabaseUserId: string): Promise<AppUser | null> {
    const record = await prisma.user.findUnique({ where: { supabaseUserId } });
    return record ? this.map(record) : null;
  }

  async findById(id: string): Promise<AppUser | null> {
    const record = await prisma.user.findUnique({ where: { id } });
    return record ? this.map(record) : null;
  }

  async findFirstUnlinked(): Promise<AppUser | null> {
    const record = await prisma.user.findFirst({ where: { supabaseUserId: null }, orderBy: { createdAt: "asc" } });
    return record ? this.map(record) : null;
  }

  async create(data: { supabaseUserId?: string | null; email?: string | null }): Promise<AppUser> {
    const record = await prisma.user.create({
      data: {
        supabaseUserId: data.supabaseUserId ?? null,
        email: data.email ?? null,
      },
    });
    return this.map(record);
  }

  async update(userId: string, data: { supabaseUserId?: string | null; email?: string | null }): Promise<AppUser> {
    const record = await prisma.user.update({
      where: { id: userId },
      data: {
        supabaseUserId: data.supabaseUserId,
        email: data.email ?? null,
      },
    });
    return this.map(record);
  }

  private map(record: { id: string; supabaseUserId: string | null; email: string | null; createdAt: Date; updatedAt: Date }): AppUser {
    return {
      id: record.id,
      supabaseUserId: record.supabaseUserId,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
