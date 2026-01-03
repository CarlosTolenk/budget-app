-- CreateEnum
CREATE TYPE "PresetBucketKey" AS ENUM ('NEEDS', 'WANTS', 'SAVINGS');

-- CreateTable
CREATE TABLE "UserBucket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "mode" "BucketMode" NOT NULL,
    "presetKey" "PresetBucketKey",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetBucket" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userBucketId" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetBucket_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "Transaction" ADD COLUMN     "userBucketId" TEXT;

-- AddColumn
ALTER TABLE "ScheduledTransaction" ADD COLUMN     "userBucketId" TEXT;

-- AddColumn
ALTER TABLE "TransactionDraft" ADD COLUMN     "userBucketId" TEXT;

-- AddColumn
ALTER TABLE "Category" ADD COLUMN     "userBucketId" TEXT;

-- AddColumn
ALTER TABLE "Rule" ADD COLUMN     "userBucketId" TEXT;

-- Seed preset buckets per user (Necesarios, Prescindibles, Ahorro)
INSERT INTO "UserBucket" ("id", "userId", "name", "sortOrder", "mode", "presetKey", "createdAt", "updatedAt")
SELECT CONCAT('c', encode(gen_random_bytes(16), 'hex')), "User"."id", 'Necesarios', 0, 'PRESET', 'NEEDS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT DO NOTHING;

INSERT INTO "UserBucket" ("id", "userId", "name", "sortOrder", "mode", "presetKey", "createdAt", "updatedAt")
SELECT CONCAT('c', encode(gen_random_bytes(16), 'hex')), "User"."id", 'Prescindibles', 1, 'PRESET', 'WANTS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT DO NOTHING;

INSERT INTO "UserBucket" ("id", "userId", "name", "sortOrder", "mode", "presetKey", "createdAt", "updatedAt")
SELECT CONCAT('c', encode(gen_random_bytes(16), 'hex')), "User"."id", 'Ahorro', 2, 'PRESET', 'SAVINGS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT DO NOTHING;

-- Backfill new FK references using the legacy bucket enum
UPDATE "Category" c
SET "userBucketId" = ub."id"
FROM "UserBucket" ub
WHERE ub."userId" = c."userId"
  AND ub."presetKey"::text = c."bucket"::text;

UPDATE "Transaction" t
SET "userBucketId" = ub."id"
FROM "UserBucket" ub
WHERE ub."userId" = t."userId"
  AND ub."presetKey"::text = t."bucket"::text;

UPDATE "TransactionDraft" td
SET "userBucketId" = ub."id"
FROM "UserBucket" ub
WHERE ub."userId" = td."userId"
  AND ub."presetKey"::text = td."bucket"::text;

UPDATE "ScheduledTransaction" st
SET "userBucketId" = ub."id"
FROM "UserBucket" ub
WHERE ub."userId" = st."userId"
  AND ub."presetKey"::text = st."bucket"::text;

UPDATE "Rule" r
SET "userBucketId" = ub."id"
FROM "Category" c
JOIN "UserBucket" ub ON ub."userId" = c."userId" AND ub."presetKey"::text = c."bucket"::text
WHERE r."categoryId" = c."id";

-- Backfill BudgetBucket rows from legacy targets
INSERT INTO "BudgetBucket" ("id", "budgetId", "userBucketId", "targetAmount", "createdAt", "updatedAt")
SELECT CONCAT('c', encode(gen_random_bytes(16), 'hex')), b."id", ub."id", b."needsTarget", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Budget" b
JOIN "UserBucket" ub ON ub."userId" = b."userId" AND ub."presetKey" = 'NEEDS';

INSERT INTO "BudgetBucket" ("id", "budgetId", "userBucketId", "targetAmount", "createdAt", "updatedAt")
SELECT CONCAT('c', encode(gen_random_bytes(16), 'hex')), b."id", ub."id", b."wantsTarget", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Budget" b
JOIN "UserBucket" ub ON ub."userId" = b."userId" AND ub."presetKey" = 'WANTS';

INSERT INTO "BudgetBucket" ("id", "budgetId", "userBucketId", "targetAmount", "createdAt", "updatedAt")
SELECT CONCAT('c', encode(gen_random_bytes(16), 'hex')), b."id", ub."id", b."savingsTarget", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Budget" b
JOIN "UserBucket" ub ON ub."userId" = b."userId" AND ub."presetKey" = 'SAVINGS';

-- Ensure new columns are non-null
ALTER TABLE "Category" ALTER COLUMN "userBucketId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "userBucketId" SET NOT NULL;
ALTER TABLE "TransactionDraft" ALTER COLUMN "userBucketId" SET NOT NULL;
ALTER TABLE "ScheduledTransaction" ALTER COLUMN "userBucketId" SET NOT NULL;
ALTER TABLE "Rule" ALTER COLUMN "userBucketId" SET NOT NULL;

-- Drop legacy columns and indexes
ALTER TABLE "Category" DROP COLUMN "bucket";
ALTER TABLE "Transaction" DROP COLUMN "bucket";
ALTER TABLE "TransactionDraft" DROP COLUMN "bucket";
ALTER TABLE "ScheduledTransaction" DROP COLUMN "bucket";
DROP INDEX IF EXISTS "TransactionDraft_bucket_idx";

ALTER TABLE "Budget"
  DROP COLUMN "needsTarget",
  DROP COLUMN "wantsTarget",
  DROP COLUMN "savingsTarget";

-- Add constraints for new relations
ALTER TABLE "UserBucket"
  ADD CONSTRAINT "UserBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScheduledTransaction"
  ADD CONSTRAINT "ScheduledTransaction_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TransactionDraft"
  ADD CONSTRAINT "TransactionDraft_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Rule"
  ADD CONSTRAINT "Rule_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BudgetBucket"
  ADD CONSTRAINT "BudgetBucket_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BudgetBucket_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "UserBucket_userId_idx" ON "UserBucket"("userId");
CREATE UNIQUE INDEX "UserBucket_userId_presetKey_key" ON "UserBucket"("userId", "presetKey");

CREATE INDEX "Transaction_userBucketId_idx" ON "Transaction"("userBucketId");
CREATE INDEX "ScheduledTransaction_userBucketId_idx" ON "ScheduledTransaction"("userBucketId");
CREATE INDEX "TransactionDraft_userBucketId_idx" ON "TransactionDraft"("userBucketId");
CREATE INDEX "Category_userBucketId_idx" ON "Category"("userBucketId");
CREATE INDEX "Rule_userBucketId_idx" ON "Rule"("userBucketId");
CREATE INDEX "BudgetBucket_userBucketId_idx" ON "BudgetBucket"("userBucketId");
CREATE UNIQUE INDEX "BudgetBucket_budgetId_userBucketId_key" ON "BudgetBucket"("budgetId", "userBucketId");

-- Drop legacy enum
DROP TYPE "Bucket";
