import { Router } from "express";

import { addBook, editBook, borrowBook, returnBook, renewBook, getAllBorrowedBooks, deleteBookByCount, deleteSameMultipleBook, getDashBoardInfo, editBookUpdated, addStock, } from "../controllers/books/book.js";

import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../middleware/authMiddleware.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { 
    addBookSchema, 
    editBookSchema, 
    returnBookSchema, 
    deleteBookSchema, 
    deleteBookByCountSchema 
} from "../validation/schema.js";

import { getAllBooks, getAvailableBooks, getBooksWithDuplication, getBorrowedBooksForMember } from "../controllers/commons/common.js";

const router = Router();

/**
 * @description Book management routes
 * @basePath /api/v1/book
 */

/**
 * @route GET /getall
 * @description Get all books in the library
 * @access All authenticated users
 */
router.route('/getall').get(isCookieAuthorized, getAllBooks);

/**
 * @route GET /getavailable
 * @description Get all available books (not currently borrowed)
 * @access All authenticated users
 */
router.route('/getavailable').get(isCookieAuthorized, getAvailableBooks);

/**
 * @route GET /getwithduplicates
 * @description Get all books including duplicates
 * @access All authenticated users
 */
router.route('/getwithduplicates').get(isCookieAuthorized, getBooksWithDuplication);

/**
 * @route POST /getformember
 * @description Get borrowed books for a specific member
 * @access All authenticated users
 */
router.route('/getformember').post(isCookieAuthorized, getBorrowedBooksForMember);

/**
 * @route POST /add
 * @description Add a new book to the library
 * @access Admin and SuperAdmin
 */
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(addBookSchema), addBook);

/**
 * @route POST /edit
 * @description Edit existing book details
 * @access Admin and SuperAdmin
 */
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(editBookSchema), editBookUpdated);

/**
 * @route POST /borrow
 * @description Borrow a book
 * @access Admin and SuperAdmin
 */
router.route('/borrow').post(isCookieAuthorized, admin_superAdmin_both, borrowBook);

/**
 * @route POST /return
 * @description Return a borrowed book
 * @access Admin and SuperAdmin
 */
router.route('/return').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(returnBookSchema), returnBook);

/**
 * @route POST /renew
 * @description Renew a borrowed book
 * @access Admin and SuperAdmin
 */
router.route('/renew').post(isCookieAuthorized, admin_superAdmin_both, renewBook);

/**
 * @route GET /getallborrowed
 * @description Get all currently borrowed books
 * @access Admin and SuperAdmin
 */
router.route('/getallborrowed').get(isCookieAuthorized, admin_superAdmin_both, getAllBorrowedBooks);

/**
 * @route POST /addstock
 * @description Add stock to existing books
 * @access Admin and SuperAdmin
 */
router.route('/addstock').post(isCookieAuthorized, admin_superAdmin_both, addStock);

/**
 * @route GET /dashboard
 * @description Get dashboard information for admin/superadmin
 * @access Admin and SuperAdmin
 */
router.route('/dashboard').get(isCookieAuthorized, admin_superAdmin_both, getDashBoardInfo);

/**
 * @route POST /deleteall
 * @description Delete all copies of a specific book
 * @access SuperAdmin only
 */
router.route('/deleteall').post(isCookieAuthorized, super_admin_only, validateSchema(deleteBookSchema), deleteSameMultipleBook);

/**
 * @route POST /delete
 * @description Delete specific number of copies of a book
 * @access SuperAdmin only
 */
router.route('/delete').post(isCookieAuthorized, super_admin_only, validateSchema(deleteBookByCountSchema), deleteBookByCount);

/**
 * @route POST /editbooknew
 * @description Edit book details (superadmin only)
 * @access SuperAdmin only
 */
router.route('/editbooknew').post(isCookieAuthorized, super_admin_only, validateSchema(editBookSchema), editBookUpdated);

export default router