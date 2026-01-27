-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "BucketMode" AS ENUM ('PRESET', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'User'
    ) THEN
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bucketMode" "BucketMode" NOT NULL DEFAULT 'PRESET';
    END IF;
END $$;
