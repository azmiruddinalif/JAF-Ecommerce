/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "JerseyType" AS ENUM ('HOME', 'AWAY', 'THIRD', 'RETRO');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "type" "JerseyType" NOT NULL DEFAULT 'HOME';

-- AlterTable
ALTER TABLE "StoreSetting" ADD COLUMN     "heroShowcase1ImagePublicId" TEXT,
ADD COLUMN     "heroShowcase1ImageUrl" TEXT,
ADD COLUMN     "heroShowcase2ImagePublicId" TEXT,
ADD COLUMN     "heroShowcase2ImageUrl" TEXT,
ADD COLUMN     "heroShowcase3ImagePublicId" TEXT,
ADD COLUMN     "heroShowcase3ImageUrl" TEXT,
ADD COLUMN     "heroShowcaseProductIds" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "coverImagePublicId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorName" TEXT NOT NULL DEFAULT 'JAF Team',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "Product_type_published_idx" ON "Product"("type", "published");
