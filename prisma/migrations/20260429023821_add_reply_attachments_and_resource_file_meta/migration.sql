-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "forumReplyId" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "fileMimeType" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER;

-- CreateIndex
CREATE INDEX "Attachment_forumReplyId_idx" ON "Attachment"("forumReplyId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_forumReplyId_fkey" FOREIGN KEY ("forumReplyId") REFERENCES "ForumReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
