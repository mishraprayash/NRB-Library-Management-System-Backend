/*
  Warnings:

  - A unique constraint covering the columns `[bookId]` on the table `BorrowedBook` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[memberId]` on the table `BorrowedBook` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BorrowedBook_bookId_key" ON "BorrowedBook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowedBook_memberId_key" ON "BorrowedBook"("memberId");
