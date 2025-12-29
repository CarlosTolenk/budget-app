-- DropForeignKey
ALTER TABLE "GmailCredential" DROP CONSTRAINT "GmailCredential_userId_fkey";

-- DropIndex
DROP INDEX "Budget_month_key";

-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "Transaction_emailMessageId_key";

-- DropIndex
DROP INDEX "TransactionDraft_emailMessageId_key";

-- AlterTable
ALTER TABLE "GmailCredential" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "GmailCredential" ADD CONSTRAINT "GmailCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
