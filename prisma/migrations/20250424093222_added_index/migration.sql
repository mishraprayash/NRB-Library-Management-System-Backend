-- CreateIndex
CREATE INDEX "Book_bookCode_idx" ON "Book"("bookCode");

-- CreateIndex
CREATE INDEX "Book_name_idx" ON "Book"("name");

-- CreateIndex
CREATE INDEX "Book_category_idx" ON "Book"("category");

-- CreateIndex
CREATE INDEX "BorrowedBook_bookId_idx" ON "BorrowedBook"("bookId");

-- CreateIndex
CREATE INDEX "BorrowedBook_memberId_idx" ON "BorrowedBook"("memberId");

-- CreateIndex
CREATE INDEX "BorrowedBook_returned_idx" ON "BorrowedBook"("returned");

-- CreateIndex
CREATE INDEX "BorrowedBook_expiryDate_idx" ON "BorrowedBook"("expiryDate");

-- CreateIndex
CREATE INDEX "Member_role_idx" ON "Member"("role");

-- CreateIndex
CREATE INDEX "Member_isActive_idx" ON "Member"("isActive");

-- CreateIndex
CREATE INDEX "Member_emailVerificationToken_idx" ON "Member"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "Member_resetPasswordToken_idx" ON "Member"("resetPasswordToken");
