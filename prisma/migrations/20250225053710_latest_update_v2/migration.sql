/*
  Warnings:

  - You are about to drop the `VARIABLES` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "VARIABLES";

-- CreateTable
CREATE TABLE "Variables" (
    "id" SERIAL NOT NULL,
    "MAX_BOOK_LIMIT" INTEGER NOT NULL DEFAULT 3,
    "MAX_RENEWAL_LIMIT" INTEGER NOT NULL DEFAULT 2
);

-- CreateIndex
CREATE UNIQUE INDEX "Variables_id_key" ON "Variables"("id");
