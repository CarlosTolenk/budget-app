export interface AppUser {
  id: string;
  supabaseUserId?: string | null;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
