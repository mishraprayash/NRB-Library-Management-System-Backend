import { Router } from "express";

import { addBook, editBook, borrowBook, returnBook, renewBook, getAllBorrowedBooks, deleteBookByCount, deleteSameMultipleBook, getDashBoardInfo, editBookUpdated, addStock, } from "../controllers/books/book.js";

import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../lib/authMiddleware.js";

import { getAllBooks, getAvailableBooks, getBooksWithDuplication, getBorrowedBooksForMember } from "../controllers/commons/common.js";

const router = Router();

/* 
The routes used in this file are all book related routes.
The prefix endpoint for all this route will be /api/v1/book.
*/

/* 
Can be accessed by all the users
*/
router.route('/getall').get(isCookieAuthorized, getAllBooks);
router.route('/getavailable').get(isCookieAuthorized, getAvailableBooks);
router.route('/getwithduplicates').get(isCookieAuthorized, getBooksWithDuplication);
router.route('/getformember').post(isCookieAuthorized, getBorrowedBooksForMember);

/* 
SuperAdmin and Admin Only Routes
*/
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, addBook);
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, editBook);
router.route('/borrow').post(isCookieAuthorized, admin_superAdmin_both, borrowBook);
router.route('/return').post(isCookieAuthorized, admin_superAdmin_both, returnBook);
router.route('/renew').post(isCookieAuthorized, admin_superAdmin_both, renewBook);
router.route('/getallborrowed').get(isCookieAuthorized, admin_superAdmin_both, getAllBorrowedBooks);
router.route('/addstock').post(isCookieAuthorized,admin_superAdmin_both, addStock);

// this route is for getting dashboard information for admin/superadmin
router.route('/dashboard').get(isCookieAuthorized, admin_superAdmin_both, getDashBoardInfo);


/*
Super Admin Only Routes
These routes are for deleting books which can only be done by superadmin
*/
router.route('/deleteall').post(isCookieAuthorized, super_admin_only, deleteSameMultipleBook);
router.route('/delete').post(isCookieAuthorized, super_admin_only, deleteBookByCount);
router.route('/editbooknew').post(isCookieAuthorized, super_admin_only, editBookUpdated);

export default router