import { Router } from "express";

import { addBook, editBook, borrowBook, returnBook, renewBook, getAllBorrowedBooks, deleteBookByCount, deleteSameMultipleBook, getDashBoardInfo, } from "../controllers/books/book.js";

import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../lib/authMiddleware.js";

import { getAllBooks, getAvailableBooks, getBooksWithDuplication, getBorrowedBooksForMember } from "../controllers/commons/common.js";

const router = Router();

/* 

The routes used in this file are all book related routes.
The prefix endpoint for all this route will be /api/v1/book.
*/

/* 
Common Routes
*/
router.route('/getall').get(isCookieAuthorized, getAllBooks)
router.route('/getavailable').get(isCookieAuthorized, getAvailableBooks)
router.route('/getwithduplicates').get(isCookieAuthorized, getBooksWithDuplication)
router.route('/getformember').post(isCookieAuthorized, getBorrowedBooksForMember)

/* 
SuperAdmin and Admin Only Routes
*/
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, addBook);
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, editBook);
router.route('/borrow').post(isCookieAuthorized, admin_superAdmin_both, borrowBook);
router.route('/return').post(isCookieAuthorized, admin_superAdmin_both, returnBook);
router.route('/renew').post(isCookieAuthorized, admin_superAdmin_both, renewBook)
router.route('/getallborrowed').get(isCookieAuthorized, admin_superAdmin_both, getAllBorrowedBooks)
router.route('/dashboard').get(isCookieAuthorized, admin_superAdmin_both, getAllBorrowedBooks)

/*
Super Admin Only Routes
*/
router.route('/deleteall').post(isCookieAuthorized, super_admin_only, deleteSameMultipleBook);
router.route('/delete').post(isCookieAuthorized, super_admin_only, deleteBookByCount);

export default router