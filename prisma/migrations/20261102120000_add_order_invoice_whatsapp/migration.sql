-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoiceWhatsAppSentAt" TIMESTAMP(3),
ADD COLUMN     "invoiceWhatsAppError" TEXT;
