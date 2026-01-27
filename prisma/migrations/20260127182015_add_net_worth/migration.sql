-- CreateEnum
CREATE TYPE "NetWorthCategory" AS ENUM ('ASSET', 'DEBT', 'LIQUIDITY');

-- DropForeignKey
ALTER TABLE "BudgetBucket" DROP CONSTRAINT "BudgetBucket_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "BudgetBucket" DROP CONSTRAINT "BudgetBucket_userBucketId_fkey";

-- DropForeignKey
ALTER TABLE "UserBucket" DROP CONSTRAINT "UserBucket_userId_fkey";

-- CreateTable
CREATE TABLE "NetWorthSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "category" "NetWorthCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "entity" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetWorthItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetWorthSnapshot_userId_idx" ON "NetWorthSnapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthSnapshot_userId_month_key" ON "NetWorthSnapshot"("userId", "month");

-- CreateIndex
CREATE INDEX "NetWorthItem_snapshotId_idx" ON "NetWorthItem"("snapshotId");

-- AddForeignKey
ALTER TABLE "UserBucket" ADD CONSTRAINT "UserBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetBucket" ADD CONSTRAINT "BudgetBucket_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetBucket" ADD CONSTRAINT "BudgetBucket_userBucketId_fkey" FOREIGN KEY ("userBucketId") REFERENCES "UserBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthSnapshot" ADD CONSTRAINT "NetWorthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthItem" ADD CONSTRAINT "NetWorthItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "NetWorthSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
