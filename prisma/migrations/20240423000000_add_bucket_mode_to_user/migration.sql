-- CreateEnum
CREATE TYPE "BucketMode" AS ENUM ('PRESET', 'CUSTOM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bucketMode" "BucketMode" NOT NULL DEFAULT 'PRESET';
