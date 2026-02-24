-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "status" "BidStatus" NOT NULL DEFAULT 'PENDING';
