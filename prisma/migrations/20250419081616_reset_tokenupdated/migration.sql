-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpiry" TIMESTAMP(3);
