-- CreateTable
CREATE TABLE "GmailCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "labelFilter" TEXT,
    "historyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GmailCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailCredential_userId_key" ON "GmailCredential"("userId");
CREATE INDEX "GmailCredential_userId_idx" ON "GmailCredential"("userId");

-- AddForeignKey
ALTER TABLE "GmailCredential" ADD CONSTRAINT "GmailCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
