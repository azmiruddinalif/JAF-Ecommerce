-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "showInHeroBanner" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_published_showInHeroBanner_idx" ON "Product"("published", "showInHeroBanner");
