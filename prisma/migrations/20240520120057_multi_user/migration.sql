-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");
CREATE INDEX "User_supabaseUserId_idx" ON "User"("supabaseUserId");

-- Seed legacy user placeholder
INSERT INTO "User" ("id") VALUES ('seed-user')
ON CONFLICT ("id") DO NOTHING;

-- Transaction table updates
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_emailMessageId_key";
ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT;
UPDATE "Transaction" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE UNIQUE INDEX "Transaction_userId_emailMessageId_key" ON "Transaction"("userId", "emailMessageId");

-- ScheduledTransaction table updates
ALTER TABLE "ScheduledTransaction" ADD COLUMN "userId" TEXT;
UPDATE "ScheduledTransaction" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "ScheduledTransaction" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "ScheduledTransaction_userId_idx" ON "ScheduledTransaction"("userId");

-- TransactionDraft table updates
ALTER TABLE "TransactionDraft" DROP CONSTRAINT IF EXISTS "TransactionDraft_emailMessageId_key";
ALTER TABLE "TransactionDraft" ADD COLUMN "userId" TEXT;
UPDATE "TransactionDraft" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "TransactionDraft" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "TransactionDraft" ADD CONSTRAINT "TransactionDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "TransactionDraft_userId_idx" ON "TransactionDraft"("userId");
CREATE UNIQUE INDEX "TransactionDraft_userId_emailMessageId_key" ON "TransactionDraft"("userId", "emailMessageId");

-- Category table updates
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_name_key";
ALTER TABLE "Category" ADD COLUMN "userId" TEXT;
UPDATE "Category" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- Budget table updates
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_month_key";
ALTER TABLE "Budget" ADD COLUMN "userId" TEXT;
UPDATE "Budget" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "Budget" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Budget_userId_month_key" ON "Budget"("userId", "month");
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- Rule table updates
ALTER TABLE "Rule" ADD COLUMN "userId" TEXT;
UPDATE "Rule" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "Rule" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Rule_userId_idx" ON "Rule"("userId");

-- Income table updates
ALTER TABLE "Income" ADD COLUMN "userId" TEXT;
UPDATE "Income" SET "userId" = 'seed-user' WHERE "userId" IS NULL;
ALTER TABLE "Income" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Income_userId_idx" ON "Income"("userId");
