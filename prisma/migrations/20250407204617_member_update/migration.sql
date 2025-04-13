-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerificationTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
