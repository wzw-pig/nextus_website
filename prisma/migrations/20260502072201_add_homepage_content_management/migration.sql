-- CreateEnum
CREATE TYPE "HomeModule" AS ENUM ('PROJECT', 'ACHIEVEMENT', 'TEAM_STYLE');

-- CreateTable
CREATE TABLE "HomeContentItem" (
    "id" TEXT NOT NULL,
    "module" "HomeModule" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeContentItem_module_sortOrder_idx" ON "HomeContentItem"("module", "sortOrder");
