-- AlterTable
ALTER TABLE "BorrowedBook" ADD COLUMN     "expiredDate" TIMESTAMP(3),
ADD COLUMN     "returnedDate" TIMESTAMP(3);
