-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_publishedById_fkey";

-- AlterTable
ALTER TABLE "IntranetUser" ADD COLUMN     "isForumAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "publishedByIntranetId" TEXT,
ALTER COLUMN "publishedById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "IntranetMessage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderName" TEXT NOT NULL DEFAULT '系统',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "IntranetMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntranetMessage_createdAt_idx" ON "IntranetMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_publishedByIntranetId_fkey" FOREIGN KEY ("publishedByIntranetId") REFERENCES "IntranetUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntranetMessage" ADD CONSTRAINT "IntranetMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "IntranetUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
