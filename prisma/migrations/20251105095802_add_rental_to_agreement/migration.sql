-- AlterTable
ALTER TABLE "RentAgreement" ADD COLUMN     "rentalId" TEXT;

-- AddForeignKey
ALTER TABLE "RentAgreement" ADD CONSTRAINT "RentAgreement_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
