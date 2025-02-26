/*
  Warnings:

  - You are about to drop the column `stock` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "stock";

-- AlterTable
ALTER TABLE "BorrowedBook" ADD COLUMN     "renewalCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VARIABLES" (
    "id" SERIAL NOT NULL,
    "MAX_BOOK_LIMIT" INTEGER NOT NULL DEFAULT 3,
    "MAX_RENEWAL_LIMIT" INTEGER NOT NULL DEFAULT 2
);

-- CreateIndex
CREATE UNIQUE INDEX "VARIABLES_id_key" ON "VARIABLES"("id");
