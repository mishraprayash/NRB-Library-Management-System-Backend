import { Router } from 'express';
import {
  addBook,
  borrowBook,
  returnBook,
  renewBook,
  getAllBorrowedBooks,
  deleteBookByCount,
  deleteSameMultipleBook,
  getDashBoardInfo,
  editBookUpdated,
  addStock,
  getRecentlyAddedBooks,
  getExpiredBooks,
} from '../controllers/book.controller.js';
import {
  addBookSchema,
  editBookSchema,
  returnBookSchema,
  deleteBookSchema,
  deleteBookByCountSchema,
  addStockSchema,
  searchAllBookSchema,
  searchBorrowedBookSchema,
} from '../validation/schema.js';

import {
  getAllBooks,
  getAvailableBooks,
  getBooksWithDuplication,
  getBorrowedBooksForMember,
} from '../controllers/common.controller.js';
import {
  isCookieAuthorized,
  admin_superAdmin_both,
  super_admin_only,
} from '../middleware/authMiddleware.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { validateUser } from '../middleware/validateUser.js';

/**
 * @description Book management routes
 * @basePath /api/v1/book
 */

const router = Router();

router
  .route('/getavailable')
  .get(isCookieAuthorized, getAvailableBooks);
router.route('/getwithduplicates').get(isCookieAuthorized, getBooksWithDuplication);
router.route('/getformember').post(isCookieAuthorized, getBorrowedBooksForMember);
router.route('/borrow').post(isCookieAuthorized, validateUser, admin_superAdmin_both, borrowBook);
router.route('/dashboard').get(isCookieAuthorized, admin_superAdmin_both, getDashBoardInfo);
router.route('/renew').post(isCookieAuthorized, admin_superAdmin_both, renewBook);
router.route('/getallborrowed').get(isCookieAuthorized, admin_superAdmin_both, getAllBorrowedBooks);
router.route('/getall').get(isCookieAuthorized, getAllBooks);
router
  .route('/add')
  .post(isCookieAuthorized, admin_superAdmin_both, validateSchema(addBookSchema), addBook);
router
  .route('/edit')
  .post(isCookieAuthorized, admin_superAdmin_both, validateSchema(editBookSchema), editBookUpdated);
router
  .route('/return')
  .post(isCookieAuthorized, admin_superAdmin_both, validateSchema(returnBookSchema), returnBook);
router
  .route('/addstock')
  .post(isCookieAuthorized, admin_superAdmin_both, validateSchema(addStockSchema), addStock);
router
  .route('/deleteall')
  .post(
    isCookieAuthorized,
    super_admin_only,
    validateSchema(deleteBookSchema),
    deleteSameMultipleBook
  );
router
  .route('/delete')
  .post(
    isCookieAuthorized,
    super_admin_only,
    validateSchema(deleteBookByCountSchema),
    deleteBookByCount
  );
router.route('/recent').get(isCookieAuthorized, getRecentlyAddedBooks);
router.route('/expired').get(isCookieAuthorized, getExpiredBooks);

export default router;
