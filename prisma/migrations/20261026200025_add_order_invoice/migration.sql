-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "invoicePdfUrl" TEXT,
ADD COLUMN     "invoicePdfPublicId" TEXT,
ADD COLUMN     "invoiceEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "invoiceEmailError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_invoiceNumber_key" ON "Order"("invoiceNumber");
