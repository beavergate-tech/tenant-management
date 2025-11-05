-- AlterTable
ALTER TABLE "RentAgreement" ADD COLUMN     "rentAmount" DOUBLE PRECISION,
ADD COLUMN     "securityDeposit" DOUBLE PRECISION,
ADD COLUMN     "templateVariables" JSONB,
ADD COLUMN     "terms" TEXT;
