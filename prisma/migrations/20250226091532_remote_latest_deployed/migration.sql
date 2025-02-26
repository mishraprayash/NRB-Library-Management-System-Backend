/*
  Warnings:

  - Changed the type of `publishedYear` on the `Book` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "publishedYear",
ADD COLUMN     "publishedYear" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Variables" ALTER COLUMN "MAX_BOOK_LIMIT" DROP DEFAULT,
ALTER COLUMN "MAX_RENEWAL_LIMIT" DROP DEFAULT,
ALTER COLUMN "EXPIRYDATE" DROP DEFAULT;
