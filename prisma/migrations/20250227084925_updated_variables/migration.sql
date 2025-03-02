/*
  Warnings:

  - Changed the type of `category` on the `Book` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `CONSECUTIVE_BORROW_LIMIT_DATE` to the `Variables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Variables" ADD COLUMN     "CATEGORIES" TEXT[],
ADD COLUMN     "CONSECUTIVE_BORROW_LIMIT_DATE" INTEGER NOT NULL;
