-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newsId" TEXT,
    "forumPostId" TEXT,
    "uploadedByAdminId" TEXT,
    "uploadedByIntranetId" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_createdAt_idx" ON "Attachment"("createdAt");

-- CreateIndex
CREATE INDEX "Attachment_newsId_idx" ON "Attachment"("newsId");

-- CreateIndex
CREATE INDEX "Attachment_forumPostId_idx" ON "Attachment"("forumPostId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_forumPostId_fkey" FOREIGN KEY ("forumPostId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedByIntranetId_fkey" FOREIGN KEY ("uploadedByIntranetId") REFERENCES "IntranetUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
